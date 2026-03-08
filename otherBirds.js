export default class OtherBirds {
    constructor(scene) {
        this.scene = scene;
        this.sprites = [];
        this.speedX = -2;
        this.spawnInterval = 5000; 
        this.spawnTimer = 0;
        this.width = 64;
        this.mySpeed = -1;
    }
    
    preload() {
        this.scene.load.image('otherBird11', 'assets/images/bird11.png');
        this.scene.load.image('otherBird12', 'assets/images/bird12.png');
        this.scene.load.image('otherBird13', 'assets/images/bird13.png');
        this.scene.load.image('otherBird21', 'assets/images/bird21.png');
        this.scene.load.image('otherBird22', 'assets/images/bird22.png');
        this.scene.load.image('otherBird23', 'assets/images/bird23.png');
        this.scene.load.image('otherBird31', 'assets/images/bird31.png');
        this.scene.load.image('otherBird32', 'assets/images/bird32.png');
        this.scene.load.image('otherBird33', 'assets/images/bird33.png');
        this.scene.load.image('otherBird41', 'assets/images/bird41.png');
        this.scene.load.image('otherBird42', 'assets/images/bird42.png');
        this.scene.load.image('otherBird43', 'assets/images/bird43.png');
    }

    create() {
        for (let i = 0; i < 4; i++) {
            this.scene.anims.create({
                key: 'bird'+i,
                frames:[
                    {key : 'otherBird' + (i+1) + '1'},
                    {key : 'otherBird' + (i+1) + '2'},
                    {key : 'otherBird' + (i+1) + '3'},   
                    {key : 'otherBird' + (i+1) + '2'},
                ],
                frameRate: 10,
                repeat: -1
            })
        }
    }

    createSprite(x, y, i) {
        // 使用动画的第一帧作为精灵的初始纹理
        const initialFrameKey = 'otherBird' + (i+1) + '1';
        const sprite = this.scene.add.sprite(x, y, initialFrameKey);
        sprite.play('bird'+i);
        this.sprites.push(sprite);
    }

    setSpeed(speedX) {
        this.speedX = speedX;
    }
    
    update(delta){
        this.spawnTimer += delta;
        // 清理被销毁的精灵
        this.sprites = this.sprites.filter(sprite => {
            if (sprite.active) {
                sprite.x += (this.speedX+this.mySpeed)*(delta/16.67);
                if(sprite.anims.currentFrame.index === 3){
                    sprite.y +=0.8;
                }
                else if(sprite.anims.currentFrame.index === 1){
                    sprite.y -=0.8;
                }
                if(sprite.x < -100){
                    sprite.destroy();
                    return false; // 从数组中移除
                }
                return true; // 保留在数组中
            }
            return false; // 如果精灵不活跃，也从数组中移除
        });
        
        if(this.scene.season == 'spring' && this.spawnTimer >= this.spawnInterval){
            this.createSprite(
                888+this.width*0.5, 
                Math.random() * 750 + 70, 
                Math.floor(Math.random() * 4)
            );
            this.spawnTimer = -10000; // 重置计时器
        }
    }

    getSprites() {
        return this.sprites;
    }
}