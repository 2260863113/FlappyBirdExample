export default class AllPipes {
    constructor(scene, pipeSpeed = -2) {
        this.scene = scene;
        this.pipes = [];     // 存储所有管道组
        this.usedPipes = []; // 对象池：存储可复用的管道    
        this.sorts = ['normal', 'narrow','moveableY','moveableX','invisible','wall'];
        this.weights = [100,1,1,1,0,100];
        this.pipeSpeedX = pipeSpeed;
        this.maxSpeedY = 2;
        this.normalSpeed = pipeSpeed;
        this.pipeSpacing = 420;
        this.gapHeight = 200;
        this.narrowHeight = 150;
        this.gapYRange = { min: 180, max: 700 };
        this.delta = 0;
        this.isTransitioning = false;  // 添加过渡状态
        this.transitionTween = null;   // 过渡动画
        this.alpha = 1;
        this.season = 'summer';
        // 纹理管理
        this.currentTexture = 'pipe-summer';
        this.targetTexture = 'pipe-summer';
        this.lastTexture = 'pipe-summer';
    }

    preload() {
        this.scene.load.image('pipe-summer', 'assets/images/tube-summer.png');
        this.scene.load.image('pipe-autumn', 'assets/images/tube-autumn.png');
        this.scene.load.image('pipe-spring', 'assets/images/tube-spring.png');  // 如果没有春天的特殊纹理
        this.scene.load.image('pipe-winter', 'assets/images/tube-winter.png');  // 如果没有冬天的特殊纹理
    }

    create() {
        this.pipeTextures = {
            spring: 'pipe-spring',
            summer: 'pipe-summer',
            autumn: 'pipe-autumn',
            winter: 'pipe-winter'
        };
        
        this.currentTexture = this.pipeTextures['summer'];
        this.lastTexture = this.pipeTextures['summer'];
        this.targetTexture = this.currentTexture;
        
        const pipeTexture = this.scene.textures.get(this.currentTexture);
        this.pipeHeight = pipeTexture.getSourceImage().height;
        this.pipeWidth = pipeTexture.getSourceImage().width;
        // 预创建管道对象放入对象池
        for (let i = 0; i < 20; i++) {  // 增加对象池大小，因为每个管道需要新旧两个纹理
            this.createSinglePipe();
        }
        
        this.createPipeGroup(888);
    }

    getGapHeight(sort) {
        if (sort === 'narrow') {
            return this.narrowHeight;
        }
        return this.gapHeight;
    }

    getGapCenterY(sort) {
        if (sort === 'moveableY') {
            return Phaser.Math.Between(this.gapYRange.min + 100, this.gapYRange.max - 100);   
        }
        return Phaser.Math.Between(this.gapYRange.min, this.gapYRange.max);
    }

    getPipeY(sort, gapHeight, gapCenterY) {
        if (sort === 'wall') {
            const topY = 844 - 0.5 * this.pipeHeight;
            const bottomY = 0.5 * this.pipeHeight;
            return [topY, bottomY];
        }
        return [
            gapCenterY - gapHeight / 2 - 0.5 * this.pipeHeight,
            gapCenterY + gapHeight / 2 + 0.5 * this.pipeHeight
        ];
    }

    // 创建一组管道
    createPipeGroup(left) {
        const x = left + 0.5 * this.pipeWidth;
        let sort = this.weightedRandom(this.sorts, this.weights);

        if(this.season === 'winter' || this.season ==='autumn'){
            if(sort == 'narrow' || sort == 'wall'|| sort == 'invisible'){
                sort ='normal';
            }
        }

        const gapHeight = this.getGapHeight(sort);
        const gapCenterY = this.getGapCenterY(sort);
        const [topPipeY, bottomPipeY] = this.getPipeY(sort, gapHeight, gapCenterY);

        // 创建管道组数据对象
        const pipeGroup = {
            x: x,
            left: left,
            gapCenterY: gapCenterY,
            passed: false,
            sort: sort,
            moveStartTime: this.scene.time.now,
            topOriginalY: topPipeY,
            bottomOriginalY: bottomPipeY,
            collided: false,
            active: true,
            
            // 上下管道的新旧纹理
            top: this.createPipeSprite(x, topPipeY, true, sort),
            bottom: this.createPipeSprite(x, bottomPipeY, false, sort)
        };
        
        this.pipes.push(pipeGroup);
        return pipeGroup;
    }

    // 创建管道精灵（包含新旧两个纹理）
    createPipeSprite(x, y, isTop, sort) {
        // 从对象池获取或创建新的管道数据对象
        let pipeData = null;
        
        // 尝试从对象池获取
        for (let i = 0; i < this.usedPipes.length; i++) {
            if (!this.usedPipes[i].isActive) {
                pipeData = this.usedPipes[i];
                break;
            }
        }
        
        // 如果没有可用的，创建新的
        if (!pipeData) {
            pipeData = {
                isActive: false,
                newSprite: this.scene.add.sprite(-100, -100, this.currentTexture).setDepth(5),
                oldSprite: this.scene.add.sprite(-100, -100, this.currentTexture).setDepth(4),
                x: 0,
                y: 0,
                sort: null,
                speedY: -3,
                isTop: isTop
            };
            this.setupPipeSprite(pipeData.newSprite, isTop);
            this.usedPipes.push(pipeData);
        }
    
        // 重置管道
        this.resetPipeData(pipeData, x, y, isTop, sort);
        return pipeData;
    }

    // 设置管道精灵的基本属性
    setupPipeSprite(sprite, isTop) {
        sprite.setOrigin(0.5, 0.5);
        sprite.setActive(false);
        sprite.setVisible(false);
        if (isTop) {
            sprite.setFlipY(false);
        } else {
            sprite.setFlipY(true);
        }
    }

    setPipeSpacing(spacing) {
        this.pipeSpacing = spacing;
    }

    resetPipeSpacing() {
        this.pipeSpacing = 420;
    }
    // 重置管道数据
    resetPipeData(pipeData, x, y, isTop, sort) {
        pipeData.isActive = true;
        pipeData.x = x;
        pipeData.y = y;
        pipeData.sort = sort;
        pipeData.isTop = isTop;
        
        // 设置新纹理精灵
        pipeData.newSprite.setTexture(this.currentTexture);
        pipeData.newSprite.setPosition(x, y);
        pipeData.newSprite.setActive(true);
        pipeData.newSprite.setVisible(true);
        pipeData.newSprite.setAlpha(this.alpha);
        
        pipeData.oldSprite.setTexture(this.lastTexture);
        pipeData.oldSprite.setPosition(x, y);
        pipeData.oldSprite.setActive(true);
        pipeData.oldSprite.setVisible(true);
        pipeData.oldSprite.setAlpha(1);


        // 设置翻转
        if (isTop) {
            pipeData.newSprite.setFlipY(false);
            pipeData.oldSprite.setFlipY(false);
        } else {
            pipeData.newSprite.setFlipY(true);
            pipeData.oldSprite.setFlipY(true);
        }
        
        return pipeData;
    }

    // 创建单个管道（用于对象池）
    createSinglePipe() {
        const pipeData = {
            isActive: false,
            newSprite: this.scene.add.sprite(-100, -100, this.currentTexture).setDepth(5),
            oldSprite: this.scene.add.sprite(-100, -100, this.currentTexture).setDepth(4),
            x: 0,
            y: 0,
            sort: null,
            speedY: -3,
            isTop: true
        };
        
        this.setupPipeSprite(pipeData.newSprite, true);
        this.usedPipes.push(pipeData);
        return pipeData;
    }

    setSeason(season) {
        this.season = season;
        const targetTexture = this.pipeTextures[season];//根据季节选择目标纹理
        
        // 如果目标纹理和当前纹理相同，或者正在过渡中，直接返回
        if (this.isTransitioning || this.currentTexture === targetTexture) {
            return;
        }
        
        this.isTransitioning = true;    // 设置过渡状态
        this.lastTexture = this.currentTexture;  // 保存当前纹理作为旧纹理
        this.currentTexture = targetTexture;
        
        const setPipe = (sprite) => {
            sprite.newSprite.setTexture(this.currentTexture);
            sprite.oldSprite.setTexture(this.lastTexture);
            sprite.newSprite.setAlpha(0);
            sprite.oldSprite.setActive(true);
            sprite.oldSprite.setVisible(true);
        }

        this.pipes.forEach(pipeGroup => {
            setPipe(pipeGroup.top);
            setPipe(pipeGroup.bottom);
        })
        
        // 停止之前的过渡动画
        if (this.transitionTween) {
            this.transitionTween.stop();
            this.transitionTween = null;
        };

        this.alpha = 0;
        
        this.transitionTween = this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 5000,
            ease: 'Linear',
            onUpdate: () => {
                const progress = this.alpha;
                this.pipes.forEach(pipeGroup => {
                    this.updatePipeTransition(pipeGroup.top, progress);
                    this.updatePipeTransition(pipeGroup.bottom, progress);
                });
            },
            onComplete: () => {
                // 完成过渡
                this.completeTextureTransition();
            },
        });
    }

    updatePipeTransition(pipeData, progress) {
        if (!pipeData.newSprite.active) return;
        // 更新新纹理透明度
        pipeData.newSprite.setAlpha(progress);
        // 更新旧纹理透明度
        if (pipeData.oldSprite && pipeData.oldSprite.active) {
            pipeData.oldSprite.setAlpha(1);
        }
    }

    // 完成纹理过渡
    completeTextureTransition() {
        this.pipes.forEach(pipeGroup => {
            pipeGroup.top.newSprite.setTexture(this.currentTexture);
            pipeGroup.bottom.newSprite.setTexture(this.currentTexture);
            pipeGroup.top.newSprite.setAlpha(1);
            pipeGroup.bottom.newSprite.setAlpha(1);
            pipeGroup.top.oldSprite.setActive(false);
            pipeGroup.bottom.oldSprite.setActive(false);
            pipeGroup.top.oldSprite.setVisible(false);
            pipeGroup.bottom.oldSprite.setVisible(false);
        });
        
        this.alpha = 1;
        this.isTransitioning = false;
        this.transitionTween = null;
    }

    weightedRandom(items, weights) {
        let sum = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * sum;
        return items[weights.findIndex(w => (rand -= w) <= 0)];
    }

    getLastPipeGroup() {
        if (this.pipes.length === 0) return null;
        return this.pipes[this.pipes.length - 1];
    }

    setGapHeight(height){
        this.gapHeight = height;
    }
    resetGapHeight(){
        this.gapHeight = 200;
    }

    recyclePipes() {
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipeGroup = this.pipes[i];
            
            // 如果整组管道都移出屏幕左侧
            if (pipeGroup.x + this.pipeWidth < 0) {
                // 回收管道到对象池
                this.recyclePipeData(pipeGroup.top);
                this.recyclePipeData(pipeGroup.bottom);
                
                // 从活动管道组中移除
                this.pipes.splice(i, 1);
            }
        }
    }

    // 回收管道数据
    recyclePipeData(pipeData) {
        pipeData.isActive = false;
        pipeData.newSprite.setActive(false);
        pipeData.newSprite.setVisible(false);
        pipeData.newSprite.setPosition(-100, -100);
        pipeData.oldSprite.setActive(false);
        pipeData.oldSprite.setVisible(false);
        pipeData.oldSprite.setPosition(-100, -100);
        this.usedPipes.push(pipeData);
    }

    movePipesX() {
        if (this.scene.gameState != 1) {
            return;
        }
        
        for (let pipeGroup of this.pipes) {
            const moveX = this.pipeSpeedX * (this.delta / 16.67);
            pipeGroup.x += moveX;
            pipeGroup.left = pipeGroup.x - 0.5 * this.pipeWidth;
            
            // 移动新纹理
            pipeGroup.top.newSprite.x = pipeGroup.x;
            pipeGroup.bottom.newSprite.x = pipeGroup.x;
            
            // 移动旧纹理（如果存在）
            if (pipeGroup.top.oldSprite) {
                pipeGroup.top.oldSprite.x = pipeGroup.x;
            }
            if (pipeGroup.bottom.oldSprite) {
                pipeGroup.bottom.oldSprite.x = pipeGroup.x;
            }
            
            // 处理隐形管道
            if (pipeGroup.sort === 'invisible') {
                this.updateInvisiblePipe(pipeGroup);
            }
        }
    }

    // 更新隐形管道透明度
    updateInvisiblePipe(pipeGroup) {
        if (pipeGroup.collided) {
            pipeGroup.top.newSprite.setAlpha(1);
            pipeGroup.bottom.newSprite.setAlpha(1);
            pipeGroup.top.oldSprite.setAlpha(1);
            pipeGroup.bottom.oldSprite.setAlpha(1);
            return;
        }
        
        const birdX = this.scene.bird.getPosition().x;
        const dist = pipeGroup.x - birdX;
        const invisibleDist = 0.5 * this.pipeWidth + 50;
        
        let alpha = 1;
        if (dist > invisibleDist) {
            alpha = (dist - invisibleDist) / 300;
        } else if (dist > -0.5 * this.pipeWidth) {
            alpha = 0;
        } else {
            const absDist = -dist;
            alpha = (absDist - 0.5 * this.pipeWidth) / 100;
        }
        
        alpha = Phaser.Math.Clamp(alpha, 0, 1);
        pipeGroup.top.newSprite.setAlpha(alpha*this.alpha);
        pipeGroup.bottom.newSprite.setAlpha(alpha*this.alpha);       
        pipeGroup.top.oldSprite.setAlpha(alpha);
        pipeGroup.bottom.oldSprite.setAlpha(alpha);
        
        if (pipeGroup.top.oldSprite) pipeGroup.top.oldSprite.setAlpha(alpha);
        if (pipeGroup.bottom.oldSprite) pipeGroup.bottom.oldSprite.setAlpha(alpha);
    }

    movePipesY() {
        const currentTime = this.scene.time.now;
        for (let pipeGroup of this.pipes) {
            if (pipeGroup.sort === 'moveableY') {
                this.updateSinMovement(pipeGroup, currentTime);
            }
        }
    }

    update(delta) {
        this.delta = delta;
        if (this.scene.gameState != 1) {
            return;
        }
        this.movePipesX();
        this.recyclePipes();
        this.checkPassed(this.scene.bird, this.scene.score);
        this.movePipesY();
        
        const lastPipeGroup = this.getLastPipeGroup();
        if (lastPipeGroup && lastPipeGroup.left < 888 - this.pipeSpacing) {
            this.createPipeGroup(888);
        }
    }

    updateSinMovement(pipeGroup, currentTime) {
        const amplitude = 50;
        const frequency = 0.0004;
        const timeDiff = currentTime - pipeGroup.moveStartTime;
        const sinOffset = amplitude * Math.sin(2 * Math.PI * frequency * timeDiff);
        
        // 更新新纹理位置
        pipeGroup.top.newSprite.y = pipeGroup.topOriginalY + sinOffset;
        pipeGroup.bottom.newSprite.y = pipeGroup.bottomOriginalY + sinOffset;
        
        // 更新旧纹理位置（如果存在）
        if (pipeGroup.top.oldSprite) {
            pipeGroup.top.oldSprite.y = pipeGroup.topOriginalY + sinOffset;
        }
        if (pipeGroup.bottom.oldSprite) {
            pipeGroup.bottom.oldSprite.y = pipeGroup.bottomOriginalY + sinOffset;
        }
    }

    // 检查小鸟是否通过管道
    checkPassed(birdInstance, score) {
        const birdX = birdInstance.bird.x;
        for (let pipeGroup of this.pipes) {
            if (pipeGroup.passed) {
                continue;
            }
            if (pipeGroup.x + this.pipeWidth < birdX) {
                pipeGroup.passed = true;
                score.addScore(1);
                
                if (pipeGroup.sort === 'moveableX') {
                    this.scene.time.addEvent({
                        delay: 16.67,
                        callback: () => {
                            pipeGroup.x -= 1.5* this.normalSpeed * (this.delta / 16.67);
                            pipeGroup.left = pipeGroup.x - 0.5 * this.pipeWidth;
                            pipeGroup.top.newSprite.x = pipeGroup.x;
                            pipeGroup.bottom.newSprite.x = pipeGroup.x;
                            
                            if (pipeGroup.top.oldSprite) pipeGroup.top.oldSprite.x = pipeGroup.x;
                            if (pipeGroup.bottom.oldSprite) pipeGroup.bottom.oldSprite.x = pipeGroup.x;
                        },
                        repeat: 35
                    });
                }
            }
        }
    }

    // 重置所有管道
    reinit() {
        
        // 停止过渡动画
        if (this.transitionTween) {
            this.transitionTween.stop();
            this.transitionTween = null;
        }
        for (let i = this.pipes.length - 1; i >= 0; i--){
            const pipeGroup = this.pipes[i];
            this.recyclePipeData(pipeGroup.top);
            this.recyclePipeData(pipeGroup.bottom);
            this.pipes.splice(i, 1);
        }        
        this.setGapHeight(200);
        this.resetPipeSpacing(420);
        this.isTransitioning = false;
        this.currentTexture = 'summer';
        this.lastTexture = 'summer';
        this.alpha = 1;
        // 重新创建初始管道
        this.create();
    }

    // 设置管道速度
    setSpeed(speed) {
        this.pipeSpeedX = speed;
    }

    // 设置管道间距
    setSpacing(spacing) {
        this.pipeSpacing = spacing;
    }

    // 获取碰撞检测用的精灵
    getCollisionSprites() {
        const sprites = [];
        this.pipes.forEach(pipeGroup => {
            if (!pipeGroup.collided) {
                sprites.push(pipeGroup.top.newSprite);
                sprites.push(pipeGroup.bottom.newSprite);
            }
        });
        return sprites;
    }

    // 标记管道为已碰撞
    markAsCollided(pipeGroup) {
        pipeGroup.collided = true;
        if (pipeGroup.sort === 'invisible') {
            pipeGroup.top.newSprite.setAlpha(1);
            pipeGroup.bottom.newSprite.setAlpha(1);
            pipeGroup.top.oldSprite.setAlpha(1);
            pipeGroup.bottom.oldSprite.setAlpha(1);
        }
    }

    // 兼容主函数的旧接口
    get width() {
        return this.pipeWidth;
    }
    
    // 添加一个方法来获取旧的接口格式（为了兼容性）
    getPipesForDebug() {
        return this.pipes.map(pipeGroup => ({
            top: pipeGroup.top.newSprite,
            bottom: pipeGroup.bottom.newSprite,
            x: pipeGroup.x,
            sort: pipeGroup.sort,
            collided: pipeGroup.collided
        }));
    }
}