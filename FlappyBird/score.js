export default class Score {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;
        this.finalScore= 0;
        this.lastBestScore = 0;
        this.bestScore = 0;
        this.currentScoreContainer = this.scene.add.container(0, 0);
        this.bestScoreContainer = this.scene.add.container(0, 0);
        this.finalScoreContainer = this.scene.add.container(0, 0);
        this.digitWidth = 60; // 数字图片宽度（根据实际情况调整）
        this.digitHeight = 91; // 数字图片高度（根据实际情况调整）
        this.spacing = 2; // 数字间距
        this.visible = true;
    }

    preload() {
        // 预加载数字0-9的图片
        for (let i = 0; i <= 9; i++) {
            this.scene.load.image(`digit${i}`, `assets/images/${i}.png`);
        }
    }

    create() {
        // 设置分数显示位置（窗口正上方）
        const screenWidth = this.scene.sys.game.config.width;
        
        this.currentScoreContainer.setDepth(200);
        this.currentScoreContainer.setPosition(screenWidth / 2, 60);
        this.updateScoreDisplay(this.currentScoreContainer,1,0);
        
        this.bestScoreContainer.setDepth(200);
        this.bestScoreContainer.setPosition(120, 60);
        this.bestScoreContainer.setVisible(false);
        this.updateScoreDisplay(this.bestScoreContainer,0.7,0);


        this.finalScoreContainer.setDepth(200);
        this.finalScoreContainer.setPosition(-120, 60);
        this.finalScoreContainer.setVisible(false);  
        this.updateScoreDisplay(this.finalScoreContainer,0.7,0);
        return this;
    }

    /**
     * 更新分数显示
     */
    updateScoreDisplay(container,scale = 1,score) {
        // 清除现有数字精灵
        container.removeAll(true);
        // 将分数转换为字符串
        const scoreStr = score.toString();
        const digitCount = scoreStr.length;
        
        // 计算总宽度以居中显示

        //score.x是整个分数的中心横坐标，所以要减去一半的整个宽度，但是要加上一个数字的半宽度，作为第一个数字的中心横坐标
        // 为每个数字创建精灵
        for (let i = 0; i < digitCount; i++) {
            const digit = parseInt(scoreStr[i],10);
            const x = (i * (this.digitWidth*scale + this.spacing));
            
            const digitSprite = this.scene.add.sprite(x, 0 , `digit${digit}`);
            digitSprite.setScale(scale);
            // 设置深度，确保分数显示在顶层
            digitSprite.setDepth(200);
            digitSprite.setVisible(this.visible);
            container.add(digitSprite);
        }
        return container;
    }

    addScore(points = 1) {
        // const oldScore = this.score;
        this.score += points;
        this.finalScore = this.score;
        this.bestScore = Math.max(this.bestScore, this.score);

        this.updateScoreDisplay(this.currentScoreContainer,1,this.score);
        this.updateScoreDisplay(this.bestScoreContainer,0.7,this.bestScore);
        this.updateScoreDisplay(this.finalScoreContainer,0.7,this.finalScore);
        
        return this;
    }

    getScore() {
        return this.score;
    }

    reinit() {
        this.score = 0;
        this.finalScore = 0;
        // localStorage.removeItem('flappyBirdHighScore');
        this.updateScoreDisplay(this.currentScoreContainer,1,this.score);
        
        return this;
    }


};