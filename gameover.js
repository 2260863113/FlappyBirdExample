export default class GameOverMenu {
    constructor(scene) {
        this.scene = scene;
        this.container = this.scene.add.container(0, 0);
        this.menu = null; // 游戏结束菜单图片
        this.isVisible = false; // 菜单是否可见
        this.isAnimating = false; // 是否正在播放动画
        this.finalY = 0; // 菜单最终停留的Y坐标
        this.startY = 0; // 菜单初始Y坐标（屏幕底部以下）
        this.animationDuration = 1000; // 动画持续时间（毫秒）
        this.easyInTween = null; // 缓入动画
        this.easyOutTween = null; // 缓出动画
    }

    preload() {
        // 预加载游戏结束菜单图片
        this.texture = this.scene.load.image('gameoverMenu', 'assets/images/gameover.png');
        
    }

    create() {
        this.menuHeight = this.scene.textures.get('gameoverMenu').getSourceImage().height;
        this.menuWidth = this.scene.textures.get('gameoverMenu').getSourceImage().width;
        const screenWidth = this.scene.sys.game.config.width;
        const screenHeight = this.scene.sys.game.config.height;
        
        // 计算菜单位置
        this.finalY = screenHeight * 0.4 ; // 最终停在屏幕中央偏上
        this.startY = screenHeight + 0.5 * this.menuHeight; // 初始位置在屏幕底部以下
        
        // 创建游戏结束菜单图片
        this.menu = this.scene.add.sprite(0,0, 'gameoverMenu')
            .setDepth(100) // 设置较高的深度值，确保在最顶层显示
            .setVisible(false);
        this.container.add(this.menu);
        this.container.setDepth(1000);
        this.container.setPosition(screenWidth / 2, this.startY);

        this.bestScoreContainer= this.scene.score.bestScoreContainer;
        this.finalScoreContainer = this.scene.score.finalScoreContainer;
        this.container.add(this.bestScoreContainer);
        this.container.add(this.finalScoreContainer);
        return this;
    }

    /**
     * 显示游戏结束菜单
     */
    showMenu() {
        if (this.isVisible || this.isAnimating) return;

        this.scene.score.updateScoreDisplay(this.scene.score.finalScoreContainer,0.7,this.scene.score.finalScore);
        this.bestScoreContainer.setVisible(true);
        this.finalScoreContainer.setVisible(true);
        this.isAnimating = true;
        this.isVisible = true;
        
        // 显示菜单
        this.menu.setVisible(true);
        
        // 播放菜单弹出动画
        this.easyInTween = this.scene.tweens.add({
            targets: this.container,
            y: this.finalY,
            duration: this.animationDuration,
            ease: 'cubic.easeOut', // 使用弹性效果，有回弹感
            onComplete: () => {
                this.isAnimating = false;
            }
        });

    }

    /**
     * 隐藏游戏结束菜单
     */
    hideMenu() {
        if (!this.isVisible) return;
        
        this.isAnimating = true;
        this.scene.tweens.killTweensOf(this.container); // 停止缓入动画
        // 播放菜单下潜动画
        this.easyOutTween = this.scene.tweens.add({
            targets: this.container,
            y: this.startY, // 回到初始位置
            duration: this.animationDuration,
            ease: 'quad.easeOut', // 使用缓入效果
            onComplete: () => {
                this.menu.setVisible(false);
                this.isVisible = false;
                this.isAnimating = false;
                this.bestScoreContainer.setVisible(false);
                this.finalScoreContainer.setVisible(false);
            }
        });
    }

    /**
     * 重置菜单状态
     */
    reset() {
        if (this.container) {
            // 立即隐藏菜单，不播放动画
            this.menu.setVisible(false);
            this.container.y = this.startY; // 重置到初始位置
            this.isVisible = false;
            this.isAnimating = false;
        }
    }

    /**
     * 检查菜单是否可见
     * @returns {boolean} 菜单可见状态
     */
    isMenuVisible() {
        return this.isVisible;
    }

    /**
     * 检查菜单是否正在动画中
     * @returns {boolean} 菜单动画状态
     */
    isMenuAnimating() {
        return this.isAnimating;
    }

    /**
     * 获取菜单信息
     */
    getInfo() {
        if (!this.menu) return null;
        
        return {
            position: { x: this.container.x, y: this.container.y },
            visible: this.isVisible,
            animating: this.isAnimating,
            finalY: this.finalY,
            startY: this.startY
        };
    }
}