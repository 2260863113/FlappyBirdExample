import Background from './background.js';
import Ground from './ground.js';
import Bird from './bird.js';
import AllPipes from './pipe.js';
import Score from './score.js';
import GameOverMenu from './gameover.js';
import DriftEffect from './driftEffect.js';
import Weather from './weather.js'; 
import SuperEffect from './superEffect.js';
import OtherBirds from './otherBirds.js';


//   http://192.168.37.1:8080
//   http://192.168.206.1:8080
//   http://192.168.1.23:8080
//   http://127.0.0.1:8080
const debugFlag = true;

// 定义游戏主场景类
class GameScene extends Phaser.Scene {
    constructor() {

        //从类定义开头的extend处继承父类（phaser.Scene），并且给这个子类起了个名字叫做GameScene
        super({ key: 'GameScene' });
        
    }

    initData(){
        this.gameState = 0;
        this.seasonTime = 0;
        this.seasonInterval = 45000;
        this.velocityX = -2;
        this.gameTimer = 0;
        this.seasonIndex = 0;
        this.seasons = ['spring', 'summer', 'autumn', 'winter'];
        this.season = this.seasons[this.seasonIndex];
    }

    initFlags() {
        this.invincible = false;
    }
    preload() {
        this.initData();
        this.initFlags();
        // 初始化游戏对象
        this.background = new Background(this);
        this.allPipes = new AllPipes(this);
        this.bird = new Bird(this);
        this.ground = new Ground(this, -2);
        this.score = new Score(this);
        this.gameOverMenu = new GameOverMenu(this); // 新增 
        this.driftEffect = new DriftEffect(this);
        this.weather = new Weather(this);
        this.superEffect = new SuperEffect(this);
        this.otherBirds =  new OtherBirds(this);

        // 预加载资源
        this.driftEffect.preload();
        this.background.preload();
        this.bird.preload();
        this.ground.preload();
        this.score.preload();
        this.gameOverMenu.preload(); // 新增
        this.allPipes.preload();
        this.weather.preload();
        this.otherBirds.preload();
    }
    
    create() {
        // 创建游戏对象
        this.background.create();
        this.allPipes.create();
        this.ground.create();
        this.score.create();
        this.gameOverMenu.create(); 
        this.driftEffect.create();
        this.weather.create();
        this.bird.create();
        this.otherBirds.create();

        this.loadBestScore();
       
        this.debugText = this.add.text(10, 10, '游戏状态: 等待开始', {
            fontSize: '18px', 
            fill: '#FFFFFF', 
            stroke: '#000000', 
            strokeThickness: 3,
            backgroundColor: 'rgba(0,0,0,0.5)', 
            padding: { x: 10, y: 5 }
        }).setOrigin(0, 0);

        // 设置点击事件
        this.input.on('pointerdown', () => {
            if (this.gameState == 0) {
                this.gameState = 1;
                this.bird.flap();
            } else if (this.gameState == 2) {
                this.restartGame();
            } else if (this.gameState  == 1) {
                this.bird.flap();
            }
        });
        this.input.keyboard.on('keyup', (event) => {
            if (event.key === ' ') {
                this.bird.dash();
            }
            else if( event.key === 'o'){
                this.invincible = !this.invincible;
            }
        });
        this.changeSeason();
    }
    
     async loadBestScore() {
        console.log('🔄 加载玩家最高分数...');
        
        // 检查 ScoreManager 是否可用
        if (!window.ScoreManager) {
            console.error('❌ ScoreManager 未加载');
            this.score.bestScore = 0;
            return 0;
        }
        
        try {
            // 查询当前玩家分数
            const result = await window.ScoreManager.getMyScore();
            
            if (result.success) {
                if (result.data && result.data.score) {
                    // 设置到 this.score.bestScore
                    this.score.lastBestScore = result.data.score;
                    this.score.bestScore = result.data.score;
                    this.score.updateScoreDisplay(this.score.bestScoreContainer,0.7,this.score.bestScore);
                    console.log(`✅ 已加载最高分: ${this.score.bestScore}`);
                    
                } else {
                    console.log(result.data.score)
                    // 没有记录，设置最高分为0
                    this.score.bestScore = 0;
                    console.log('📝 暂无历史最高分');
                }
            } else {
                console.error('❌ 查询失败:', result.message);
                this.score.bestScore = 0;
            }
            
            return this.score.bestScore;
        } catch (error) {
            console.error('❌ 加载最高分出错:', error);
            this.score.bestScore = 0;
            return 0;
        }
    }
    
    changeSeason() {
        
        this.seasonIndex = (this.seasonIndex + 1) % this.seasons.length;
        this.season = this.seasons[this.seasonIndex];
        this.background.setSeason(this.season);
        this.allPipes.setSeason(this.season);
        this.ground.setSeason(this.season);
        this.driftEffect.setSeason(this.season);
        this.weather.setSeason(this.season);
    }
    update(time, delta) {
        this.background.update(delta);
        this.gameTimer +=delta;
        this.seasonTime +=delta;
        if(this.seasonTime > this.seasonInterval){
            this.seasonTime = 0;
            this.changeSeason();
        }
        this.delta = delta;
        if (this.gameState == 1 && this.bird.isAlive) {
            this.checkGameover();
        }
        // this.superEffect.update(delta);
        this.weather.update(delta);
        this.allPipes.update(delta);
        this.bird.update(delta, this.gameState);
        this.ground.update(); // 更新地面
        this.otherBirds.update(delta);
        
        this.driftEffect.update(delta);
        this.updateDebugText();
    }


    screenDazzling() {
        this.cameras.main.flash(600, 255, 255, 255, 0.3); // 红色闪光
       this.cameras.main.shake(500, 0.008); // 摇动相机
    }
    checkGameover(){
        if(!this.invincible && this.checkCollisions()){
            setTimeout(() => {
                this.gameState = 2;
                this.driftEffect.setSpeed(0);
                this.gameOverMenu.showMenu(); // 显示游戏结束菜单
            },500)
            this.saveFinalScore();
            this.screenDazzling();
            this.bird.die();
        }
    }

    async saveFinalScore() {
        
        // 简单的检查
        if (!window.ScoreManager) {
            console.error('❌ ScoreManager 未定义');
            console.log('可用的全局对象:', Object.keys(window).filter(k => k.includes('Score') || k.includes('supabase')));
            return;
        }
        
        try {
            console.log('开始保存分数...', this.score.bestScore );
            if(this.score.bestScore > this.score.lastBestScore){
                const result = await window.ScoreManager.saveScore(this.score.bestScore);

            if (result.success) {
                console.log('✅ 分数保存成功:', result.message);
            } else {
                console.error('❌ 保存失败:', result.message);
            }
            }
            else{
                console.log('分数为超过最好分数，不予更新');
            }
            
            
        } catch (error) {
            console.error('❌ 保存过程中出错:', error);
        }
    }
    checkRectCollision(rect1, rect2) {
    // AABB碰撞检测公式
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
    }
    // 在 update() 或碰撞检测时添加调试图形
    checkPipesCollision(birdBounds) {
    // 获取所有用于碰撞检测的管道精灵
        const collisionSprites = this.allPipes.getCollisionSprites();
        
        for (let sprite of collisionSprites) {
            const spriteBounds = sprite.getBounds();
            
            if (this.checkRectCollision(birdBounds, spriteBounds)) {
                // 找到对应的管道组并标记为碰撞
                for (let pipeGroup of this.allPipes.pipes) {
                    if (pipeGroup.top.newSprite === sprite || pipeGroup.bottom.newSprite === sprite) {
                        this.allPipes.markAsCollided(pipeGroup);
                        break;
                    }
                }
                return true;
            }
        }
        
        // 检查顶部碰撞（管道上方边界）
        for (let pipeGroup of this.allPipes.pipes) {
            if (pipeGroup.sort != 'wall' && this.bird.getPosition().y < 0 && 
                Math.abs(this.bird.getPosition().x -pipeGroup.x) <0.5 * this.allPipes.pipeWidth) {
                this.allPipes.markAsCollided(pipeGroup);
                return true;
            }
        }
        
        return false;
    }

    checkGroundCollision(birdBounds) {
        const groundY = this.ground.getGroundTop();
        if (birdBounds.y + birdBounds.height >= groundY) {
            return true;
        }
    }

    checkOtherBirdsCollision(birdBounds) {
        const sprites = this.otherBirds.getSprites();
        for (let otherBird of sprites) {
            const otherBirdBounds = otherBird.getBounds();
            if (this.checkRectCollision(birdBounds, otherBirdBounds)) {
                return true;
            }
        }
    }

    checkLightningCollision(birdBounds) {
        if(this.season != 'summer')return false;
        const lightningBounds = this.weather.getLightningRect();
        if(this.weather.getLightningState() == 2 && this.checkRectCollision(birdBounds, lightningBounds)){
            return true;
        }
    }
    // 检查碰撞
    checkCollisions() {
        const birdBounds = this.bird.getBounds();
        return this.checkGroundCollision(birdBounds)||
                this.checkPipesCollision(birdBounds)||
                this.checkLightningCollision(birdBounds)||
                this.checkOtherBirdsCollision(birdBounds);
   
    }
    
    // 更新调试文本
    updateDebugText() {
        if (!this.debugText || !this.bird) return;
        
        const birdInfo = this.bird.getInfo();
        const groundInfo = this.ground.getInfo();
        
        let status = '等待开始';
        if (this.gameState == 1) status = '进行中';
        if (this.gameState == 2) status = '已结束';
        
        this.debugText.setText(
            `游戏状态: ${status}\n` +
            `小鸟位置: (${Math.floor(birdInfo.position.x)}, ${Math.floor(birdInfo.position.y)})\n` +
            `小鸟状态: ${birdInfo.isAlive ? '存活' : '死亡'}\n` +
            `垂直速度: ${this.bird.velocityY ? this.bird.velocityY.toFixed(2) : '0.00'}`
        );
    }
    
    // 重新开始游戏
    restartGame() {
        this.gameState = 0;
        this.time.removeAllEvents();
        this.gameOverMenu.hideMenu(); // 隐藏游戏结束菜单
        this.superEffect.reinit();
        this.bird.reinit();
        this.allPipes.reinit();
        this.score.reinit();
        this.driftEffect.reinit();
        this.weather.reinit();
        this.gameTimer = 0;
        this.seasonTime = 0;
        
        this.background.reinit();
        this.ground.reinit();
    }
}

// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 888,
    height: 888,
    parent: 'game-container',
    backgroundColor: '#4EC0CA',
    physics: { 
        default: 'arcade', 
        arcade: { 
            debug: false, 
            gravity: { y: 0 } 
        } 
    },
    
    scene: [GameScene],  // 使用类数组形式
    fps: { 
        target: 60, 
        forceSetTimeOut: false 
    }
};

// 创建游戏实例
let game;
try {
    game = new Phaser.Game(config);
} catch (error) {
    console.error('游戏启动失败:', error);
}
export { game };