export default class Bird {
    constructor(scene) {
        this.scene = scene;
        this.bird = null;
        this.frameRate = 10;
        
        this.initX = 0;
        this.initY = 0;
        this.velocityY = 0;
        this.normalGravity = 0.8;
        this.gravity = 0.8;
        this.flapStrength = -13;
        this.rotateSpeed = this.gravity * 3;
        this.isAlive = true;
        this.verticalMovement = 1;
        this.chargeLevel = 0 

        this.maxFallSpeed = 16;
        this.maxRotateSpeed = 9;
        this.dashSpeed = -15;
        this.normalSpeed = this.scene.velocityX;
        this.currentSpeed = this.normalSpeed;
        this.topLimit = false;
    }

    preload() {
        this.scene.load.image('bird1', 'assets/images/bird1.png');
        this.scene.load.image('bird2', 'assets/images/bird2.png');
        this.scene.load.image('bird3', 'assets/images/bird3.png');
    }

    create() {
        const screenWidth = this.scene.sys.game.config.width;
        const screenHeight = this.scene.sys.game.config.height;
        this.initX = screenWidth / 5;
        this.initY = screenHeight / 2;
        
        this.bird = this.scene.add.sprite(this.initX, this.initY, 'bird1').setDepth(20);
        this.angle = 0;
        this.bird.setAngle(this.angle);
        this.setSpeed(this.normalSpeed);
        this.createAnimation();
        this.bird.play('fly');

        return this;
    }

    /**
     * 创建动画的方法
     * 使用Phaser的动画系统创建鸟类的飞行动画
     */
    createAnimation() {
        // 使用场景的动画创建器来定义一个名为'fly'的动画
     
        this.scene.anims.create({
            // 动画的唯一标识符
            key: 'fly',
            // 定义动画的帧序列
            frames: [
                { key: 'bird1' }, { key: 'bird2' }, 
                { key: 'bird3' }, { key: 'bird2' }
            ],
            // 设置动画的帧率
            frameRate: this.frameRate,
            // 设置动画重复次数，-1表示无限循环
            repeat: -1
        });
    }

    update(delta, gameState) {
        if (!this.bird || gameState == 2) return this;
        
        let currentFrameKey = '';
        if (this.bird.anims && this.bird.anims.currentAnim) {
            const currentFrame = this.bird.anims.currentFrame;
            if (currentFrame && currentFrame.textureKey) {
                currentFrameKey = currentFrame.textureKey;
            }
        }
        
        if (gameState == 0) {
            if (currentFrameKey === 'bird1') {
                this.bird.y += this.verticalMovement * (delta / 16.67);
            } else if (currentFrameKey === 'bird3') {
                this.bird.y -= this.verticalMovement * (delta / 16.67);
            }
        } 
        else if(gameState == 1) {
            this.velocityY += this.gravity * (delta / 16.67);
            this.bird.y += this.velocityY * (delta / 16.67);
            if(this.topLimit && this.bird.y < 0 ){
                this.bird.y = 0;
                this.velocityY =0;
             }
            this.angle += this.rotateSpeed * (delta / 16.67);
            this.bird.setAngle(this.angle);
            // console.log(this.rotateSpeed);
            if(this.scene.input.activePointer.isDown) {
                this.rotateSpeed -= 0.25;
                if(this.rotateSpeed < 0 && this.angle < -359){
                    this.angle +=360;
                    this.chargeLevel += 1;
                    if(this.chargeLevel > 5) this.chargeLevel = 5;
                }
            }
            else{
                if(this.bird.angle < -45)
                    this.rotateSpeed = this.gravity * 8;
                else if(this.bird.angle > 75)
                    this.rotateSpeed = -this.gravity * 3;
                else
                    this.rotateSpeed = this.gravity * 3;
            }
            if(this.rotateSpeed < -this.maxRotateSpeed) this.rotateSpeed = -this.maxRotateSpeed;
            
            if (this.velocityY > this.maxFallSpeed) this.velocityY = this.maxFallSpeed;
        }
        return this;
    }

    dash(delta){
        if(this.chargeLevel > 0 && !this.scene.superEffect.getEffectState()){
            this.chargeLevel -= 1;
            this.scene.tweens.add({
                targets: this,
                currentSpeed: this.dashSpeed,  // 冲刺速度
                duration: 100,                 // 非常短的加速时间
                ease: 'Power4.in',             // 快速加速
                onUpdate: () => {
                    this.setSpeed(this.currentSpeed);
                },
                onComplete: () => {
                    // 2. 缓慢恢复到正常速度
                    this.scene.tweens.add({
                        targets: this,
                        currentSpeed: this.normalSpeed * (this.scene.delta / 16.67),  // 恢复到正常速度
                        duration: 400,                   // 较长的恢复时间
                        ease: 'Power2.out',              // 缓慢减速
                        onUpdate: () => {
                            this.setSpeed(this.currentSpeed);
                        },
                        onComplete: () => {
                            this.setSpeed(this.normalSpeed);
                        }
                    });
            }
        });
        }
    }

    setGravity(gravity){
        this.gravity = gravity;
    }

    resetGravity(){
        this.gravity = this.normalGravity;
    }
    /**
     * 获取鸟的当前位置坐标
     * @returns {Object} 返回包含x和y坐标的对象，如果bird不存在则返回{ x: 0, y: 0 }
     */
    getPosition() {
        if (!this.bird) return { x: 0, y: 0 };
        return { x: this.bird.x, y: this.bird.y };
    }

    getBounds() {
        if (!this.bird) return null;
        const displayWidth = this.bird.width * this.bird.scaleX;
        const displayHeight = this.bird.height * this.bird.scaleY;
        const originX = this.bird.originX || 0.5;
        const originY = this.bird.originY || 0.5;
        
        return {
            x: this.bird.x - displayWidth * originX,
            y: this.bird.y - displayHeight * originY,
            width: displayWidth,
            height: displayHeight,
            centerX: this.bird.x,
            centerY: this.bird.y,
            bottom: this.bird.y + displayHeight * (1 - originY)
        };
    }

    setSpeed(speed){
        this.currentSpeed = speed;
        this.scene.allPipes.setSpeed(speed);
        this.scene.ground.setSpeed(speed);
        this.scene.weather.setSpeed(speed);
        this.scene.driftEffect.setSpeed(speed);
        this.scene.otherBirds.setSpeed(speed);
    }
    setPosition(x, y) {
        this.bird.x = x;
        this.bird.y = y; 
        if(this.topLimit){
            if(this.bird.y < 0) this.bird.y = 0;
        }
        return this;
    }

    resetSpeed() {
        this.currentSpeed = this.normalSpeed;
        this.scene.allPipes.setSpeed(this.currentSpeed);
        this.scene.ground.setSpeed(this.currentSpeed);
        this.scene.weather.setSpeed(this.currentSpeed);
        this.scene.driftEffect.setSpeed(this.currentSpeed);
        this.scene.otherBirds.setSpeed(this.currentSpeed);
    }
    reinit() {
        if (this.bird) {
            this.bird.x = -0.5 * this.bird.width;
            this.bird.y = this.initY;
            this.angle = 0;
            this.bird.setAngle(this.angle);
            this.resetGravity();
            this.resetSpeed();
            this.resetMaxFallSpeed();

            this.rotateSpeed = 0;
            this.velocityY = 0;
            this.chargeLevel = 0 
            this.isAlive = true;
            this.bird.setVisible(true);
            this.bird.anims.play('fly');

            this.scene.tweens.add({
                targets: this.bird,
                x: this.initX,
                duration: 1000, 
                ease: 'quad.easeOut'
            })
        }
        return this;
    }

    flap() {
        if (!this.bird || !this.isAlive) return;
        this.velocityY = this.flapStrength;
        if(this.scene.superEffect.getEffectState() == 2){
            if(this.scene.superEffect.getEffect() == 'antiGravity'){
                this.velocityY = -this.flapStrength*0.8;
            }
            else if(this.scene.superEffect.getEffect() == 'superLight'){
                this.velocityY = this.flapStrength * 0.7;
            }
        }
        this.angle = -this.gravity * 50;
        this.bird.setAngle(this.angle);
        
        this.rotateSpeed = 0;
        return this;
    }



    die() {
        this.bird.anims.stop();
        this.isAlive = false;
        return this;
    }

    getInfo() {
        const pos = this.getPosition();
        const bounds = this.getBounds();
        return {
            position: pos,
            bounds: bounds,
            isAlive: this.isAlive,
            velocityY: this.velocityY,
            initialPosition: { x: this.initX, y: this.initY },
            currentSpeed: this.currentSpeed
        };
    }

    setMaxFallSpeed(maxFallSpeed) {
        this.maxFallSpeed = maxFallSpeed;
    }
    resetMaxFallSpeed() {
        this.maxFallSpeed = 16;
    }
    getSprite() { return this.bird; }
} 