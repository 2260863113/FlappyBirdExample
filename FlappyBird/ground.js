export default class Ground {
    constructor(scene, speed = -2) {
        this.scene = scene;
        this.groundTiles = [];  // 改为存储包含新旧纹理的对象数组
        this.groundSpeed = speed;
        this.groundWidth = 0;
        this.groundHeight = 0;
        this.groundY = 0;
        this.isTransitioning = false;
        this.transitionTween = null;
    }

    preload() {
        this.scene.load.image('ground-summer', 'assets/images/ground-summer.png');
        this.scene.load.image('ground-autumn', 'assets/images/ground-autumn.png');
        // 加载其他季节的地面纹理
        this.scene.load.image('ground-spring', 'assets/images/ground-spring.png');  // 如果没有春天的特殊纹理，用summer的
        this.scene.load.image('ground-winter', 'assets/images/ground-winter.png');  // 如果没有冬天的特殊纹理，用autumn的
    }

    create() {
        this.groundTextures = {
            spring: 'ground-spring',
            summer: 'ground-summer', 
            autumn: 'ground-autumn',
            winter: 'ground-winter'
        };
        this.currentTexture = this.groundTextures['summer'];
        this.lastTexture = null;
        
        const groundSource = this.scene.textures.get(this.currentTexture).getSourceImage();
        this.groundWidth = groundSource.width;
        this.groundHeight = groundSource.height;
        this.groundY = 888 - this.groundHeight;
        
        const groundTilesNeeded = Math.ceil(888 / this.groundWidth) + 2;
        
        // 创建地面tile对象，每个包含新旧两个纹理
        for (let i = 0; i < groundTilesNeeded; i++) {
            const tileX = i * this.groundWidth;
            
            // 创建地面tile数据对象
            const tileData = {
                x: tileX,
                newTile: this.scene.add.image(tileX, this.groundY, this.currentTexture)
                    .setOrigin(0, 0)
                    .setScale(1)
                    .setAlpha(1)
                    .setDepth(10),  // 设置较高的深度
                oldTile: null,  // 旧纹理初始为空
                tileIndex: i,
                tileWidth: this.groundWidth,
                isRecycled: false
            };
            
            this.groundTiles.push(tileData);
        }
        return this;
    }

    setSeason(season) {

        this.isTransitioning = true;
        this.lastTexture = this.currentTexture;
        this.currentTexture = this.groundTextures[season];
        
        // 清理之前的过渡动画
        if (this.transitionTween) {
            this.transitionTween.stop();
            this.transitionTween = null;
        }
        
        // 清理之前可能存在的旧纹理
        this.cleanupOldTiles();
        
        // 为每个tile创建旧纹理图片
        this.groundTiles.forEach(tileData => {
            // 创建旧纹理图片
            tileData.oldTile = this.scene.add.image(tileData.x, this.groundY, this.lastTexture)
                .setOrigin(0, 0)
                .setScale(1)
                .setAlpha(1)  // 初始完全显示
                .setDepth(9);  // 设置比新纹理稍低的深度
            
            // 设置新纹理（初始透明）
            tileData.newTile.setTexture(this.currentTexture).setAlpha(0);
        });
        
        // 创建过渡动画
        const transitionProgress = { value: 0 };
        
        this.transitionTween = this.scene.tweens.add({
            targets: transitionProgress,
            value: 1,
            duration: 5000,
            ease: 'Linear',
            onUpdate: () => {
                const progress = transitionProgress.value;
                
                this.groundTiles.forEach(tileData => {
                    if (tileData.oldTile) {
                        tileData.oldTile.setAlpha(1);  
                    }
                    tileData.newTile.setAlpha(progress);           // 新纹理淡入
                });
            },
            onComplete: () => {
                // 清理旧纹理
                this.cleanupOldTiles();
                
                // 确保所有新纹理完全显示
                this.groundTiles.forEach(tileData => {
                    tileData.newTile.setAlpha(1);
                });
                
                this.lastTexture = null;
                this.isTransitioning = false;
                this.transitionTween = null;
            }
        });
    }

    // 清理旧纹理
    cleanupOldTiles() {
        this.groundTiles.forEach(tileData => {
            if (tileData.oldTile) {
                tileData.oldTile.destroy();
                tileData.oldTile = null;
            }
        });
    }

    moveGround() {
        this.groundTiles.forEach(tileData => {
            tileData.x += this.groundSpeed;
            tileData.newTile.x = tileData.x;
            if (tileData.oldTile) {
                tileData.oldTile.x = tileData.x;
            }
        });
    }

    recyleGround() {
        this.groundTiles.forEach(tileData => {
            if (tileData.x + tileData.tileWidth <= 0) {
                // 寻找最右侧的tile
                let rightmostTile = tileData;
                this.groundTiles.forEach(otherTile => {
                    if (otherTile.x > rightmostTile.x) {
                        rightmostTile = otherTile;
                    }
                });
                
                // 将超出屏幕的tile移动到最右侧
                tileData.x = rightmostTile.x + tileData.tileWidth - 1;
                tileData.newTile.x = tileData.x;
                if (tileData.oldTile) {
                    tileData.oldTile.x = tileData.x;
                }
                
                // 如果正在过渡中，需要确保旧纹理位置正确
                if (this.isTransitioning && tileData.oldTile) {
                    // 如果旧纹理存在，确保它的纹理也是正确的
                    tileData.oldTile.setTexture(this.lastTexture);
                }
            }
        });
    }

    update() {
        if (this.scene.gameState === 2) {
            return;
        }
        this.moveGround();
        this.recyleGround();
    }

    getInfo() {
        return {
            tileWidth: this.groundWidth,
            tileHeight: this.groundHeight,
            groundY: this.groundY,
            speed: this.groundSpeed,
            tileCount: this.groundTiles.length,
            currentTexture: this.currentTexture,
            isTransitioning: this.isTransitioning
        };
    }

    setSpeed(speed) {
        this.groundSpeed = speed;
    }

    getGroundTop() { 
        return this.groundY; 
    }
    
    getGroundBottom() { 
        return this.groundY + this.groundHeight; 
    }
    
    getGroundBounds() { 
        return { 
            x: 0, 
            y: this.groundY, 
            width: 888, 
            height: this.groundHeight 
        }; 
    }

    // 重置地面状态
    reinit() {
        // 停止过渡动画
        if (this.transitionTween) {
            this.transitionTween.stop();
            this.transitionTween = null;
        }
        
        // 清理旧纹理
        this.cleanupOldTiles();
        
        // 重置所有新纹理为完全显示
        this.groundTiles.forEach(tileData => {
            tileData.newTile.setAlpha(1);
        });
        this.currentTexture = 'summer';
        this.create();
        this.isTransitioning = false;
        this.lastTexture = null;
    }

    // 获取当前的地面类型
    getCurrentSeason() {
        for (const [season, texture] of Object.entries(this.groundTextures)) {
            if (texture === this.currentTexture) {
                return season;
            }
        }
        return 'summer'; // 默认返回夏天
    }

    // 设置地面透明度（用于整体淡入淡出效果）
    setAlpha(alpha) {
        this.groundTiles.forEach(tileData => {
            tileData.newTile.setAlpha(alpha);
            if (tileData.oldTile) {
                tileData.oldTile.setAlpha(alpha * tileData.oldTile.alpha);
            }
        });
    }

    // 重新初始化地面位置（如果需要重置游戏）
    reinitialize() {
        const groundTilesNeeded = Math.ceil(888 / this.groundWidth) + 2;
        
        // 如果tile数量不匹配，调整数组
        while (this.groundTiles.length < groundTilesNeeded) {
            const lastTile = this.groundTiles[this.groundTiles.length - 1];
            const tileX = lastTile ? lastTile.x + lastTile.tileWidth : 0;
            
            const tileData = {
                x: tileX,
                newTile: this.scene.add.image(tileX, this.groundY, this.currentTexture)
                    .setOrigin(0, 0)
                    .setScale(1)
                    .setAlpha(1)
                    .setDepth(10),
                oldTile: null,
                tileIndex: this.groundTiles.length,
                tileWidth: this.groundWidth,
                isRecycled: false
            };
            
            this.groundTiles.push(tileData);
        }
        
        // 重置所有tile的位置
        for (let i = 0; i < this.groundTiles.length; i++) {
            const tileData = this.groundTiles[i];
            tileData.x = i * this.groundWidth;
            tileData.newTile.x = tileData.x;
            tileData.newTile.y = this.groundY;
            tileData.newTile.setTexture(this.currentTexture);
            tileData.newTile.setAlpha(1);
            
            // 清理旧纹理
            if (tileData.oldTile) {
                tileData.oldTile.destroy();
                tileData.oldTile = null;
            }
        }
    }
}