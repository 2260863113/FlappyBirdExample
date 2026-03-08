export default class background {
    constructor(scene) {
        this.scene = scene;
        this.tiles = [];
        this.textures = {spring:'background-spring', summer: 'background-summer', 
            autumn: 'background-autumn', winter: 'background-winter',
            night: 'background-night'};
        this.season = 'summer';
        this.speed = -0.5;
        this.width = 0;
        this.height = 0;
        this.backgroundY = 0;
        this.alpha = 1;
        this.isTransitioning = false;
        this.currentTexture = 'background-summer';
        this.lastTexture = 'background-summer';
    }

    preload() {
        this.scene.load.image('background-spring', 'assets/images/background-spring.png');
        this.scene.load.image('background-summer', 'assets/images/background-summer.png');
        this.scene.load.image('background-autumn', 'assets/images/background-autumn.png');
        this.scene.load.image('background-winter', 'assets/images/background-winter.png');
        this.scene.load.image('background-night', 'assets/images/background-night.png');
    }

    create() {
        // 重置后重新创建
        // this.reinit();
        
        const backgroundSource = this.scene.textures.get(this.currentTexture).getSourceImage();
        this.width = backgroundSource.width;
        this.height = backgroundSource.height;
        this.backgroundY = 0.5 * this.height;
        
        const tilesNeeded = Math.ceil(888 / this.width) + 2;
        
        for (let i = 0; i < tilesNeeded; i++) {
            const tileX = i * this.width;
            const newSprite = this.scene.add.image(tileX, this.backgroundY, this.currentTexture)
                .setScale(1).setDepth(0);
            const oldSprite = this.scene.add.image(tileX, this.backgroundY, this.lastTexture)
                .setScale(1).setDepth(-1).setActive(false);
            const Index = i;
            const tile ={
                newSprite: newSprite,
                oldSprite: oldSprite,
                x: tileX,
                y: this.backgroundY,
                index: Index
            }

            this.tiles.push(tile);
        }
        return this;
    }

    // 重置所有参数到初始状态
    reinit() {

        // 1. 停止所有过渡动画
        this.stopAllTransitions();
        
        // 2. 重置参数到初始值
        this.speed = -0.5;
        this.width = 0;
        this.height = 0;
        this.backgroundY = 0;
        this.alpha = 1;
        this.isTransitioning = false;
        this.currentTexture = 'background-summer';
        this.lastTexture = 'background-summer';
        
        // 3. 清理并重置 tile 数组
        this.cleanupTiles();
        this.tiles = [];
        this.create();
        return this;
    }

    // 停止所有过渡动画和效果
    stopAllTransitions() {
        if (this.isTransitioning && this.scene) {
            // 停止当前正在进行的过渡动画
            if (this.scene.tweens) {
                // 停止所有与 background 相关的 Tween
                this.scene.tweens.killTweensOf(this);
                
                // 停止所有 tile 的 Tween
                this.tiles.forEach(tile => {
                    if (tile.newSprite) {
                        this.scene.tweens.killTweensOf(tile.newSprite);
                    }
                    if (tile.oldSprite) {
                        this.scene.tweens.killTweensOf(tile.oldSprite);
                    }
                });
            }
        }
        this.isTransitioning = false;
    }

    // 清理所有 tile 精灵
    cleanupTiles() {
        this.tiles.forEach(tile => {
            if (tile.newSprite && tile.newSprite.destroy) {
                tile.newSprite.destroy();
            }
            if (tile.oldSprite && tile.oldSprite.destroy) {
                tile.oldSprite.destroy();
            }
        });
    }

    setSeason(season,reapear = false) {
        if(this.season === season) return;      
        if (this.isTransitioning) {
            this.stopAllTransitions();
        }
        
        this.season =season;
        let targetTexture = this.textures[season];
        this.lastTexture = this.currentTexture;
        this.currentTexture = targetTexture;
                    
        if(this.season ==='autumn' && !reapear){
            this.scene.time.delayedCall(10000, () => {
                this.scene.background.setSeason('night');
                this.scene.superEffect.changeEffect();
            })
            this.scene.time.delayedCall(35000, () => {
            this.scene.background.setSeason('autumn',true);
            })
        }
        // 重置所有 tile 状态
        this.tiles.forEach(tile => {
            if (tile.newSprite && tile.oldSprite) {
                tile.oldSprite.setTexture(this.lastTexture);
                tile.newSprite.setTexture(this.currentTexture);
                tile.oldSprite.setActive(true);
                tile.newSprite.setAlpha(0);
                tile.oldSprite.setAlpha(1);
            }
        });
        
        this.alpha = 0;
        this.isTransitioning = true;
        
        // 确保停止之前的 Tween
        if (this.scene.tweens) {
            this.scene.tweens.killTweensOf(this);
        }
        
        const transitionTween = this.scene.tweens.add({
            targets: this,
            duration: 5000,
            alpha: 1,
            onUpdate: () => {
                this.tiles.forEach(tile => {
                    if (tile.newSprite) {
                        tile.newSprite.setAlpha(this.alpha);  
                    }
                });
            },
            onComplete: () => {
                this.tiles.forEach(tile => {
                    if (tile.oldSprite && tile.newSprite) {
                        tile.oldSprite.setActive(false);
                        tile.oldSprite.setVisible(true);
                        tile.newSprite.setAlpha(1);
                    }
                });
                this.isTransitioning = false;
                transitionTween.remove();
            }
        });
    }

    movebackground() {
        this.tiles.forEach(tile => {
            tile.x += this.speed;
            if (tile.newSprite) {
                tile.newSprite.x = tile.x;
            }
            if (tile.oldSprite) {
                tile.oldSprite.x = tile.x;
            }
        });
    }

    recylebackground() {
        this.tiles.forEach(tile => {
            if (tile.x + this.width <= 0) {
                let rightmostTile = tile;
                this.tiles.forEach(otherTile => {
                    if (otherTile.x > rightmostTile.x) {
                        rightmostTile = otherTile;
                    }
                });
                tile.x = rightmostTile.x + this.width - 1;
                
                // 更新精灵位置
                if (tile.newSprite) {
                    tile.newSprite.x = tile.x;
                }
                if (tile.oldSprite) {
                    tile.oldSprite.x = tile.x;
                }
            }
        });
    }
    
    update() {
        if (this.scene.gameState === 2) {
            return;
        }
        this.movebackground();
        this.recylebackground();
    }

}