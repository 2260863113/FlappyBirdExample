export default class SuperEffect {
    constructor(scene) {
        this.scene = scene;
        this.superEffects = ['superHeavy','superLight','antiGravity','superFast'];
        this.effectIndex = Math.floor(Math.random() * this.superEffects.length);
        this.currentEffect = this.superEffects[this.effectIndex];
        this.speed = this.scene.velocityX;
        this.gravity = 0.8;
        this.effectState = 0;
        this.fullEffectDuration = 15000;
        this.smothInDuration = 2000;
        this.smothOutDuration = 1000;
        this.bufferDuration = 6000;
        
    }
//gv9eDWndY1weVhBs
//api公钥 sb_publishable_1npoheLG4hOhc66Llocc3A_2vZ-yT1Z
//项目url qmuclbjpqigwcbifzqxy
//data api access https://qmuclbjpqigwcbifzqxy.supabase.co/FlappyBirdScoreTable
    reinit(){
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(this);
            this.scene.tweens.killTweensOf(this.sprite);
            this.scene.tweens.killTweensOf(this.extraSprite);
        }
    }
    changeEffect() {
        if(this.scene.season != 'autumn') return;
        this.effectIndex = (this.effectIndex + 1) % this.superEffects.length;
        this.currentEffect = this.superEffects[this.effectIndex];
        this.scene.allPipes.setPipeSpacing(888);
        if(this.currentEffect != 'superHeavy' && this.currentEffect != 'superFast'){
            this.scene.allPipes.setGapHeight(300);
        }
        this.scene.time.delayedCall(15000,() =>{
            this.scene.allPipes.setPipeSpacing(888);
            this.scene.allPipes.setGapHeight(200);
        }, [], this);
        this.scene.time.delayedCall(20000,() =>{
            if(this.currentEffect != 'superFast'){
                this.scene.allPipes.resetPipeSpacing(420);
            }
                
        }, [], this);

        this.scene.time.delayedCall(this.bufferDuration,this.setEffect, [], this);
    }
    setEffect (){
        if(this.effectState || this.scene.season !='autumn') return;
        if(this.currentEffect === 'superFast') {
            this.activateSuperFast();
        }
        else if(this.currentEffect === 'superHeavy') {
            this.activateSuperHeavy();
        }
        else if(this.currentEffect === 'antiGravity') {
            this.activateAntiGravity();
        }
        else if(this.currentEffect === 'superLight') {
            this.activateSuperlight();
        }
    }

    activateSuperFast(){
        this.effectState = 1;
        this.speed = this.scene.velocityX;
        
        const tween1 = this.scene.tweens.add({

            targets:this,
            duration: this.smothInDuration,
            speed: this.scene.velocityX *6,

            onUpdate: () => {
                this.scene.bird.setSpeed(this.speed);
            },
            onComplete: () => {
                this.effectState = 2;
                tween1.remove();
                const tween2 = this.scene.tweens.add({
                    delay : this.fullEffectDuration,
                    targets:this,
                    duration: this.smothOutDuration,
                    speed: this.scene.velocityX,
                    onUpdate: () => {
                        this.scene.bird.setSpeed(this.speed);
                    },
                    onComplete: () => {
                        tween2.remove();
                        this.scene.allPipes.resetPipeSpacing(420);
                        this.effectState = 0;
                        this.scene.bird.resetSpeed();
                    }
                });
            }
        });
    }

    activateSuperlight(){
        this.effectState = 1;
        this.gravity = 0.8;
        this.scene.driftEffect.setGravity(0.2);
        this.scene.bird.setMaxFallSpeed(8);
        const tween1 = this.scene.tweens.add({
            targets:this,
            duration: this.smothInDuration,
            gravity: 0.2,
            onUpdate: () => {
                this.scene.bird.setGravity(this.gravity);
            },
            onComplete: () => {
                tween1.remove();
                this.effectState = 2;
                this.scene.allPipes.resetPipeSpacing();
                const tween2 = this.scene.tweens.add({
                    delay : this.fullEffectDuration,
                    targets:this,
                    duration: this.smothOutDuration,
                    gravity: 0.8,
                    onUpdate: () => {
                        this.scene.bird.setGravity(this.gravity);
                    },
                    onComplete: () => {
                        tween2.remove();
                        this.effectState = 0;
                        this.scene.driftEffect.setGravity(1);
                        this.scene.bird.resetMaxFallSpeed();
                        this.scene.bird.resetGravity();
                    }
                });
            }
        });
        
    }
    activateSuperHeavy(){
        this.effectState = 1;
        this.gravity = 0.8;
        this.scene.driftEffect.setGravity(4);
        const tween1 = this.scene.tweens.add({
            targets:this,
            duration: this.smothInDuration,
            gravity: 1.3,
            onUpdate: () => {
                this.scene.bird.setGravity(this.gravity);
            },
            onComplete: () => {
                tween1.remove();
                this.scene.allPipes.resetPipeSpacing();
                this.effectState = 2;
                const tween2 = this.scene.tweens.add({
                    delay : this.fullEffectDuration,
                    targets:this,
                    duration: this.smothOutDuration,
                    gravity: 0.8,
                    onUpdate: () => {
                        this.scene.bird.setGravity(this.gravity);
                    },
                    onComplete: () => {
                        tween2.remove();
                        this.effectState = 0;
                        this.scene.driftEffect.setGravity(1);
                        this.scene.bird.resetGravity();
                    }
                });
            }
        });
    }

    activateAntiGravity(){
        this.effectState = 1;
        this.scene.bird.setGravity(-0.6);
        this.scene.driftEffect.setGravity(-0.5);
        this.scene.allPipes.resetPipeSpacing();
        this.effectState = 2;
        this.scene.time.delayedCall(this.fullEffectDuration, () => {
            this.effectState = 0;
            this.scene.bird.resetGravity();
            this.scene.driftEffect.setGravity(1);

        },[],this);
        
    }

    reinit(){
        this.scene.tweens.killTweensOf(this);
        this.effectState = 0;
    }
    getEffect(){
        return this.currentEffect;
    }

    getEffectState(){
        return this.effectState;
    }
}