export default class Weather {
    constructor(scene, pipeSpeed = -2) {
        this.scene = scene;
        this.textures = {
            winter: 'fogFrontMask',
            summer: 'blackMask',
            autumn: 'blackMask'
        }
        this.durations = {
            winter: 1000,
            summer: 1000,
            autumn: 1000
        }
        this.lightningAnims = ['lightning0', 'lightning1','lightning2'];
        this.season = 'summer';
        this.texture = 'blackMask';
        this.textureCopy = 'fogForeMask';
        this.birdSpeed = pipeSpeed;
        this.mySpeed = 2.1;
        this.alpha = 0;
        this.transitionState = 0;
        this.spawnTimer = 0;

        this.rect = this.scene.add.rectangle(0, 0, 50, 880, 0x3498db, 2).setOrigin(0, 0).setDepth(1000);
        this.rect.setVisible(false);
        // 添加闪电效果相关状态变量
        this.lightningState = 0;
        this.lightningEvent = null;
    }

    // 重置所有状态到初始值
    reinit() {

        // 1. 停止所有动画和定时器
        this.stopAllAnimations();
        
        // 2. 重置状态变量
        this.season = 'summer';
        this.texture = 'blackMask';
        this.textureCopy = 'fogForeMask';
        this.birdSpeed = this.scene ? this.scene.pipeSpeed || -2 : -2;
        this.mySpeed = 2.1;
        this.alpha = 0;
        this.transitionState = 0;
        this.spawnTimer = 0;
        this.lightningState = 0;
        this.lightningEvent = null;
        
        // 3. 重置精灵状态
        if (this.sprite) {
            this.sprite.setVisible(false);
            this.sprite.setActive(false);
            this.sprite.setAlpha(0);
            this.sprite.setTexture('blackMask');
            this.sprite.setPosition(0, 0);
            this.sprite.setOrigin(0, 0);
            
            // 停止所有动画
            if (this.sprite.anims) {
                this.sprite.anims.stop();
            }
        }
        
        if (this.extraSprite) {
            this.extraSprite.setVisible(false);
            this.extraSprite.setActive(false);
            this.extraSprite.setAlpha(0);
            this.extraSprite.setPosition(0, 0);
            this.extraSprite.setOrigin(1, 0);
            
            // 停止闪电动画
            if (this.extraSprite.anims) {
                this.extraSprite.anims.stop();
                this.extraSprite.clearTint();
            }
        }
    }

    // 停止所有动画和效果
    stopAllAnimations() {
        // 停止闪电效果
        if (this.lightningState) {
            this.endLightningEffect();
        }
        
        // 停止闪电事件
        if (this.lightningEvent) {
            this.lightningEvent.remove();
            this.lightningEvent = null;
        }
        
        // 停止精灵动画
        if (this.extraSprite && this.extraSprite.anims) {
            this.extraSprite.anims.stop();
        }
        
        if (this.sprite && this.sprite.anims) {
            this.sprite.anims.stop();
        }
    }

    resetSprite(sprite,texture) {
        sprite.setAlpha(0);
        sprite.setVisible(true);
        sprite.setActive(true);
        sprite.setTexture(texture);
        sprite.setDepth(1000);
    }
    // 修改现有的 setSeason 方法，在开始前先重置
    setSeason(season) {
        // 先重置所有状态
        
        this.stopAllAnimations();
        
        // 设置当前季节
        this.season = season;
        // 根据季节更新纹理
        this.texture = this.textures[season];
        // 重置精灵
        this.resetSprite(this.sprite, this.texture);
        
        if (this.season === 'winter') {
            this.textureCopy = 'fogForeMask';
            this.resetSprite(this.extraSprite, this.textureCopy);
            this.extraSprite.x = 0;
            this.extraSprite.y = 0;
        } else if (this.season === 'summer') {
            this.resetSprite(this.extraSprite, null);
        }
        
        this.alpha = 0;
        let targetAlpha = 1;
        if (this.season === 'summer') {
            targetAlpha = 0.9;
        }
        else if(this.season === 'autumn') {
            targetAlpha = 0.3;
        }
        
        this.transitionState = 1;
        
        // 停止所有现有的 Tween
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(this);
            this.scene.tweens.killTweensOf(this.sprite);
            this.scene.tweens.killTweensOf(this.extraSprite);
        }
        
        const transitionTween1 = this.scene.tweens.add({
            targets: this,
            delay :10000,
            alpha: targetAlpha,
            duration: 3000,
            onUpdate: () => {
                this.sprite.setAlpha(this.alpha);
                if (this.season === 'winter') {
                    this.extraSprite.setAlpha(this.alpha);
                }
            },
            onComplete: () => {
                transitionTween1.remove();
                this.transitionState = 2;
                const transitionTween2 = this.scene.tweens.add({
                    targets: this,
                    alpha: 0,
                    duration: 3000,
                    delay: this.scene.seasonInterval - 20000,
                    onStart: () => {
                        this.transitionState = 3;
                    },
                    onUpdate: () => {
                        this.sprite.setAlpha(this.alpha);
                        if (this.season === 'winter') {
                            this.extraSprite.setAlpha(this.alpha);
                        }
                    },
                    onComplete: () => {
                        this.sprite.setVisible(false);
                        this.extraSprite.setVisible(false);
                        this.extraSprite.setActive(false);
                        this.sprite.setAlpha(this.alpha);
                        transitionTween2.remove();
                        this.transitionState = 0;
                        
                        // 停止闪电动画
                        if (this.extraSprite.anims) {
                            this.extraSprite.anims.stop();
                        }
                    }
                });
            }
        });
    }

    // 修改 startLightningEffect 方法，添加重置检查
    startLightningEffect() {
        // 如果已经在播放闪电效果，先停止
   
        if (this.lightningState) {
            this.endLightningEffect();
            return;
        }
        
        this.lightningState = 1;
        this.sprite.setAlpha(0.8);
        this.spawnTimer = 0;
        let flashCount = 0;
        const maxFlashes = 30;
        
        // 随机选择闪电动画
        const index = Math.floor(Math.random() * this.lightningAnims.length);
        const targetAnims = this.lightningAnims[index];
        
        


        // 根据动画类型设置位置
        if (targetAnims === 'lightning0') {
            this.extraSprite.x = this.scene.bird.getPosition().x + 310;
            this.extraSprite.y = this.scene.bird.getPosition().y - 700;
        } else if( targetAnims === 'lightning1') {
            this.extraSprite.x = this.scene.bird.getPosition().x + 380;
            this.extraSprite.y = this.scene.bird.getPosition().y - 500;
        }
        else if( targetAnims === 'lightning2') {
            this.extraSprite.x = this.scene.bird.getPosition().x + 380;
            this.extraSprite.y = 0;
        }
        if(Math.random() > 0.5) {
            this.extraSprite.x = this.scene.bird.getPosition().x + 700 + 200 * Math.random();
        }
        
        // 播放动画
        this.extraSprite.play(targetAnims);

        this.extraSprite.setDepth(1001);
        // 创建闪电效果定时器
        this.lightningEvent = this.scene.time.addEvent({
            delay: 16.67 * 4,
            callback: () => {
                if (!this.lightningState || this.transitionState ==3 || !this.extraSprite.active) {
                    // 如果效果已结束，停止定时器
             
                    if (this.lightningEvent) {
                        this.lightningEvent.remove();
                    }
                    return;
                }
                
                flashCount++;
    
                if (this.extraSprite.alpha !== 0.1) {
                    this.extraSprite.setAlpha(0.1);
                } else {
                    this.extraSprite.setAlpha(0.03);
                }
                
                // 完成所有闪烁
                if (flashCount >= maxFlashes) {
                    this.endLightningEffect();
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    // 修改 endLightningEffect 方法
    endLightningEffect() {

        this.lightningState = 2;
        
        if (this.lightningEvent) {
            this.lightningEvent.remove();
            this.lightningEvent = null;
        }
        
        
        // 最后恢复
        if (this.extraSprite && this.extraSprite.anims) {
            this.extraSprite.anims.pause();
        }
        
        if (this.extraSprite) {
            this.extraSprite.setAlpha(1);

        }
        
        if (this.sprite) {
            this.sprite.setAlpha(0.4);
        }
        
        // 使用 Phaser 的定时器
        if (this.scene && this.scene.time) {
            this.scene.time.delayedCall(200, () => {
                if (this.extraSprite) {
                    this.extraSprite.setAlpha(0);
                }
                if (this.sprite) {
                    if(this.transitionState == 2){
                        this.sprite.setAlpha(0.9);
                    }
                    else{
                        this.sprite.setAlpha(this.alpha);
                    }
                }
                this.lightningState = 0;

                // 停止动画
                if (this.extraSprite && this.extraSprite.anims) {
                    this.extraSprite.anims.stop();
                }
            }, [], this);
        }
    }

    getLightningRect() {
        return this.rect;
    }


    // 其他方法保持不变...

    getLightningState() {
        return this.lightningState;
    }

    preload() {
        this.scene.load.image('fogFrontMask', 'assets/images/fogFrontMask.png');
        this.scene.load.image('fogForeMask', 'assets/images/fogForeMask.png');
        this.scene.load.image('blackMask', 'assets/images/blackMask.png');
        this.scene.load.image('lightning00','assets/images/lightning00.png');
        this.scene.load.image('lightning01','assets/images/lightning01.png');
        this.scene.load.image('lightning10','assets/images/lightning10.png');
        this.scene.load.image('lightning11','assets/images/lightning11.png');
        this.scene.load.image('lightning20','assets/images/lightning20.png');
        this.scene.load.image('lightning21','assets/images/lightning21.png');        
    }
    create() {

        this.sprite = this.scene.add.sprite(0, 0, this.texture).setOrigin(0, 0).setDepth(100);
        this.extraSprite = this.scene.add.sprite(0, 0, this.texture).setOrigin(1, 0).setDepth(101);
        this.sprite.setVisible(false);
        this.extraSprite.setVisible(false);
        this.sprite.setActive(false);
        this.extraSprite.setActive(false);        

        this.scene.anims.create({
            key: 'lightning0',
            frames: [{ key: 'lightning00' }, { key: 'lightning01' }],
            frameRate: 20,
            repeat: -1
        })
        this.scene.anims.create({
            key: 'lightning1',
            frames: [{ key: 'lightning10' }, { key: 'lightning11' }],
            frameRate: 20,
            repeat: -1
        })
        this.scene.anims.create({
            key: 'lightning2',
            frames: [{ key: 'lightning20' }, { key: 'lightning21' }],
            frameRate: 20,
            repeat: -1
        })
    }

    setSpeed(speed){
        this.birdSpeed = speed;
    }
    update(delta) {
        this.spawnTimer += delta;
        
        if (this.extraSprite.active) {

            this.extraSprite.x += this.birdSpeed * (delta / 16.67);
            if (this.season === 'winter') {
                this.extraSprite.x += this.mySpeed * (delta / 16.67);
                this.extraSprite.x = Math.min(this.extraSprite.x, this.scene.sys.game.config.width * 0.5);
            } else if (this.season === 'summer') {
                // 添加一个状态标志，防止重复创建定时器
                const bounds = this.extraSprite.getBounds();
                this.rect.x = bounds.x + 260;
                this.rect.y = bounds.y;
                // this.rect.setStrokeStyle(2, 0xe74c3c);
                 this.rect.setFillStyle(0x000000, 0);
                if (this.transitionState == 2 &&!this.lightningState && this.spawnTimer > 5000) {
                    this.startLightningEffect();
                }
            }
        }
    }
}