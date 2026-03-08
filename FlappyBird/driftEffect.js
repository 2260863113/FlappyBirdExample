class DriftEffect {
    constructor(scene) {
        this.scene = scene;
        this.sorts = {
            spring:'petals',
            summer:'rain',
            autumn:'leaves',
            winter:'snowflakes',
        };

        // 粒子管理数组，存储所有活跃的粒子对象
        this.particles = [];
        
        this.season = 'summer';
        this.currentSort = 'rain';
        this.currentSortSettings = this.getSortSettings();
  
        this.currentSpeed = -2;
        // 粒子生成计时器，记录距离上次生成过去了多少时间
        this.spawnTimer = 0;
        
        // 全局时间累积器，用于计算正弦波动画
        this.time = 0;
        this.gravity = 1;
        // 效果激活状态标记，false时停止生成和更新粒子
        this.active = true;
        this.velocityY = 0.8;
        // 调试标记，开启时显示粒子统计信息
        this.debug = false;
    }

    /**
     * 根据效果类型获取物理参数 - 不同粒子有不同的运动特性
     * @private - 私有方法，仅在类内部使用
     */
    getSortSettings(){
        const settings = {
            leaves: { // 落叶效果
                spawnInterval: 1000, // 粒子生成间隔，单位毫秒
                count: 100, // 粒子数量
            },
            petals: { // 花瓣效果 - 比落叶更轻盈
                spawnInterval: 1000, // 粒子生成间隔，单位毫秒
                count: 100, // 粒子数量
            },
            snowflakes: { // 落叶效果
                spawnInterval: 100, // 粒子生成间隔，单位毫秒
                count: 100, // 粒子数量
            },
            rain: { // 雨滴效果 - 直线快速下落
                spawnInterval: 50, // 粒子生成间隔，单位毫秒
                count: 100, // 粒子数量
            }
        };
        // 返回对应类型的设置，如果类型不存在则返回落叶设置
        return settings[this.currentSort];
    }
    getParticleSettings(type) {
        // 预设的四种效果类型的物理参数配置
        const settings = {
            leaves: { // 落叶效果
                gravityY: 0,        // Y轴重力加速度，值越大下落越快
                minVelocityY: 1,  // Y轴最小初始速度（向上）
                maxVelocityY: 2.5,   // Y轴最大初始速度（向下）
                minAngularVelocity: 30, // 最小旋转速度
                maxAngularVelocity: 40,  // 最大旋转速度
                minScale: 0.7,      // 最小缩放比例
                maxScale: 0.8,      // 最大缩放比例
                // 正弦飘动参数 - 让落叶有左右摇摆的效果
                oscillationAmplitude: 80,   // 左右摆动幅度 (像素)
                oscillationSpeed: 1.5,       // 摆动速度系数
                minOscillationFrequency: 0.8, // 最小摆动频率（每个粒子的摆动快慢不同）
                maxOscillationFrequency: 1.2,  // 最大摆动频率

            },
            petals: { // 花瓣效果 - 比落叶更轻盈
                gravityY: 0,        // Y轴重力加速度，值越大下落越快
                minVelocityY: 2,  // Y轴最小初始速度（向上）
                maxVelocityY: 3,   // Y轴最大初始速度（向下）
                minAngularVelocity: 30, // 最小旋转速度
                maxAngularVelocity: 40,  // 最大旋转速度
                minScale: 0.7,      // 最小缩放比例
                maxScale: 0.8,      // 最大缩放比例
                // 正弦飘动参数 - 让落叶有左右摇摆的效果
                oscillationAmplitude: 80,   // 左右摆动幅度 (像素)
                oscillationSpeed: 1.5,       // 摆动速度系数
                minOscillationFrequency: 0.8, // 最小摆动频率（每个粒子的摆动快慢不同）
                maxOscillationFrequency: 1.2,  // 最大摆动频率
            },
            snowflakes: { // 落叶效果
                gravityY: 0,        // Y轴重力加速度，值越大下落越快
                minVelocityY: 1,  // Y轴最小初始速度（向上）
                maxVelocityY: 2.5,   // Y轴最大初始速度（向下）
                minAngularVelocity: 30, // 最小旋转速度
                maxAngularVelocity: 40,  // 最大旋转速度
                minScale: 0.7,      // 最小缩放比例
                maxScale: 0.8,      // 最大缩放比例
                // 正弦飘动参数 - 让落叶有左右摇摆的效果
                oscillationAmplitude: 80,   // 左右摆动幅度 (像素)
                oscillationSpeed: 1.5,       // 摆动速度系数
                minOscillationFrequency: 0.8, // 最小摆动频率（每个粒子的摆动快慢不同）
                maxOscillationFrequency: 1.2,

            },
            rain: { // 雨滴效果 - 直线快速下落
                gravityY: 0,      // 非常大的重力，快速下落
                minVelocityY: 20,   // 很大的初始下落速度
                maxVelocityY: 20,
                minAngularVelocity: 0, // 雨滴不旋转
                maxAngularVelocity: 0,
                minScale: 0.8,
                maxScale: 1.2,
                oscillationAmplitude: 0, // 雨滴没有左右摆动
                oscillationSpeed: 0,
                minOscillationFrequency: 0,
                maxOscillationFrequency: 0,
            }
        };
        // 返回对应类型的设置，如果类型不存在则返回落叶设置
        return settings[type] || settings.leaves;
    }
    
    /**
     * 预加载所需纹理 - 加载粒子图片资源
     * 必须在create()之前调用，确保资源已加载
     */
    preload() {
        this.scene.load.image('leaf1', './assets/images/mapleLeaf1.png');
        this.scene.load.image('leaf2', './assets/images/mapleLeaf2.png');
        this.scene.load.image('leaf3', './assets/images/mapleLeaf3.png');
        
        this.scene.load.image('petal1', './assets/images/petal1.png');
        this.scene.load.image('petal2', './assets/images/petal2.png');
        this.scene.load.image('petal3', './assets/images/petal3.png');
        this.scene.load.image('petal4', './assets/images/petal4.png');
        this.scene.load.image('petal5', './assets/images/petal5.png');


        this.scene.load.image('snowflake1', './assets/images/snowflake1.png');
        this.scene.load.image('snowflake2', './assets/images/snowflake2.png');
        this.scene.load.image('snowflake3', './assets/images/snowflake3.png');
        this.scene.load.image('snowflake4', './assets/images/snowflake4.png');
        this.scene.load.image('snowflake5', './assets/images/snowflake5.png');

        this.scene.load.image('raindrop', './assets/images/raindrop.png');
    }
    
    /**
     * 创建粒子系统 - 初始化粒子系统，必须在preload()之后调用
     */

    setTextureKeys() {
        let textureKeys = null;
        switch (this.currentSort) {
            case 'leaves':
                textureKeys = ['leaf1', 'leaf2', 'leaf3']; // 三种枫叶
                break;
            case 'petals':
                textureKeys = ['petal1', 'petal2', 'petal3', 'petal4', 'petal5']; // 三种花瓣
                break;
            case 'snowflakes':
                textureKeys = ['snowflake1','snowflake2','snowflake3','snowflake4','snowflake5']; // 一种雪花
                break;
            case 'rain':
                textureKeys = ['raindrop']; // 一种雨滴
                break;
            default:
                textureKeys = ['leaf1', 'leaf2', 'leaf3']; // 默认使用枫叶
        }
        
        return textureKeys;
    }
    create() {
        this.textureKeys = this.setTextureKeys();
        // 初始化粒子数组和计时器
        this.particles = [];
        this.spawnTimer = 0;
    }
    
    /**
     * 每帧更新 - 游戏主循环每帧调用，更新所有粒子状态
     * @param {number} delta - 时间增量(毫秒)，上一帧到这一帧的时间差
     */
    update(delta) {
        if (!this.active) return;
        
        // 更新时间累积器，用于正弦波计算
        this.time += delta;
        
        // 更新生成计时器
        this.spawnTimer += delta;

        if (this.spawnTimer >= this.currentSortSettings.spawnInterval && this.particles.length < this.currentSortSettings.count ) {
            this.spawnParticle();     // 生成一个新粒子
            this.spawnTimer = 0;     // 重置计时器
            this.spawnTimer -= Math.random() * 200; // 在0-100ms范围内随机偏移
        }
        

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
   
            // 如果粒子生命周期结束，移除它
            if (!particle.isAlive) {
                this.removeParticle(i);
                continue; // 跳过当前粒子的后续更新
            }
            
            // 更新粒子位置、旋转等物理状态
            this.updateParticle(particle, delta);
           
        }
    }
    
    setSeason(season) {
        this.season = season
        this.currentSort = this.sorts[season];
        this.currentSortSettings = this.getSortSettings();
        this.textureKeys = this.setTextureKeys();
    }

    spawnParticle() {
        // 获取屏幕尺寸，用于确定生成位置
        const settings = this.getParticleSettings(this.currentSort);
        this.velocityY = settings.velocityY;
        const sceneWidth = this.scene.cameras.main.width;
        const sceneHeight = this.scene.cameras.main.height;
        
        // 随机选择纹理（粒子图片）
        const textureKey = this.textureKeys[Math.floor(Math.random() * this.textureKeys.length)];
        // 随机生成位置 (从顶部生成，使效果更自然)
        let x, y;
        const spawnPosition = Math.random(); // 随机数决定生成策略
        
        x = spawnPosition * (sceneWidth + 100);
        y = -20; // 屏幕上方30%区域
 
        
        // 创建粒子精灵（Phaser的Sprite对象）
        const sprite = this.scene.add.sprite(x, y, textureKey);
        // 随机旋转角度（0到2π弧度，即0-360度）
        const rotation = 0;
        
        // 随机缩放比例
        const scale = Phaser.Math.FloatBetween(
            settings.minScale, 
            settings.maxScale
        );
        
        // 设置精灵属性
        sprite.setRotation(rotation);
        sprite.setScale(scale);
        sprite.setDepth(99); // 设置渲染深度（z-index）
        

        if (Math.random() < 0.5 && this.currentSort != 'rain') sprite.flipX = true; // 水平翻转

        const velocityY = Phaser.Math.FloatBetween(
            settings.minVelocityY, 
            settings.maxVelocityY
        );
        let angularVelocity = Phaser.Math.FloatBetween(
            settings.minAngularVelocity, 
            settings.maxAngularVelocity
        );
        if (Math.random() < 0.5) angularVelocity *= -1; // 随机方向


        
        // 正弦飘动参数（让粒子有自然的左右摆动）
        const oscillationOffset = Math.random() * Math.PI * 2; // 随机相位偏移
        const oscillationFrequency = Phaser.Math.FloatBetween(
            settings.minOscillationFrequency,
            settings.maxOscillationFrequency
        ); // 随机摆动频率
        
        // 创建粒子对象，包含所有状态信息
        const particle = {
            sprite: sprite,                   // Phaser精灵对象
            velocityY: velocityY,             // 垂直速度
            angularVelocity: angularVelocity, // 旋转速度

            // 正弦飘动参数
            isDrifting: true,                     // 粒子是否活跃
            isAlive: true,                     // 粒子是否存活
            oscillationOffset: oscillationOffset,     // 相位偏移
            oscillationAmplitude: settings.oscillationAmplitude, // 振幅
            oscillationFrequency: oscillationFrequency, // 摆动频率
            spawnTime: this.time,                     // 生成时间戳
            x: x, // 当前水平位置（用于物理计算）
            y: y, // 当前垂直位置（用于物理计算）
            scale : scale,
            sort :this.currentSort,
            settings : settings,
        };

        this.particles.push(particle);
        return particle; // 返回创建的粒子对象（可选）
    }
    
    setGravity(gravity) {
        console.log('setGravity',gravity);
        this.gravity = gravity;
    }
    /**
     * 更新单个粒子 - 计算粒子的新位置和状态
     * @private
     */
    updateParticle(particle, delta) {
        // 将毫秒转换为秒，用于物理计算
        
        const deltaSec = delta / 1000;
        
        // 应用基础重力（每帧增加下落
        // 计算正弦飘动
        // timeAlive: 粒子已经存活的时间（秒）
        const timeAlive = (this.time - particle.spawnTime) / 1000;
        
        // 正弦波公式：振幅 × sin(速度 × 时间 × 频率 + 相位偏移)
        const sin = Math.sin(
            timeAlive * particle.settings.oscillationSpeed * particle.oscillationFrequency + 
            particle.oscillationOffset
        )
        const oscillation = sin * particle.oscillationAmplitude;
        // 更新位置公式：
        // x = 初始x + 正弦摆动 + 水平速度×时间
        // y = 初始y + 垂直速度×时间 + 0.5×重力×时间²（自由落体公式）
        particle.sprite.x = particle.x + oscillation;
        if(this.scene.gameState != 2){
            particle.x += this.currentSpeed *(delta/16.67);
        }
        
        if(particle.isDrifting){
            particle.sprite.y += particle.velocityY * this.gravity*(delta/16.67);
            particle.sprite.rotation += Phaser.Math.DegToRad(particle.angularVelocity) * deltaSec;
            const newWidth = (sin * 0.2 + 0.8)*particle.scale ;
            const newHeight = particle.scale ;
            particle.sprite.setScale(newWidth,newHeight);
        }
        else if(this.season =='autumn' && this.gravity < 0){
            particle.sprite.y += particle.velocityY * this.gravity*(delta/16.67);
            particle.isDrifting = true;
        }
        // 将角速度从度/秒转换为弧度/帧，然后累加
        
        
        // 屏幕边界处理：如果粒子完全移出屏幕，立即结束生命周期
        const sceneWidth = this.scene.cameras.main.width ;
        const sceneHeight = this.scene.cameras.main.height- 44;


        const newAlpha = Math.min(sceneHeight - particle.sprite.y,0.6* sceneHeight) / (0.6 * sceneHeight);
        particle.oscillationAmplitude = particle.settings.oscillationAmplitude * newAlpha;
        // particle.sprite.setAlpha(newAlpha);
        // 检查粒子是否超出屏幕边界（留有100像素的缓冲区域）
        if (particle.sprite.x < -100) {    // 超出右侧
            if(particle.sort == this.currentSort && this.particles.length < this.currentSortSettings.count){
                particle.x += sceneWidth * 1.2;
                particle.sprite.x = particle.x;
            }
            else{
                particle.isAlive = false;     
            }
        }
        if(particle.isDrifting && particle.sprite.y > 844){
            if(particle.sort == 'rain'){
                if(this.currentSort == 'rain'){
                    particle.sprite.y = -10;
                }
                else{
                    particle.isAlive = false;
                }
            }
            else{
                particle.isDrifting = false;
            }
        }
    }
    
    /**
     * 移除粒子 - 从系统中删除指定索引的粒子
     * @private
     */
    removeParticle(index) {
        const particle = this.particles[index];
        particle.sprite.destroy();
        this.particles.splice(index, 1);
    }
    

    setActive(active) {
        this.active = active;
        
        // 如果关闭效果，将所有粒子设为半透明
        if (!active) {
            this.particles.forEach(particle => {
                particle.sprite.setAlpha(0.3);
            });
        } else {
            // 如果开启效果，恢复粒子透明度
            this.particles.forEach(particle => {
                particle.sprite.setAlpha(1);
            });
        }
    }
    
    setSpawnInterval(interval) {
        // 设置最小间隔为50ms，防止过高的性能消耗
        this.config.spawnInterval = Math.max(50, interval);
        this.spawnTimer = 0; // 重置计时器，立即重新开始计时
    }

    setSpeed(speed) {
        this.currentSpeed = speed;
    }
    reinit() {
        this.active = false;
        // 从后往前遍历移除所有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.removeParticle(i);
        }
        this.particles = []; // 清空数组
        this.spawnTimer = 0; // 重置生成计时器
        this.setGravity(1);
        this.currentSpeed = -2;
        this.setSeason('summer');
    }
    

    destroy() {
        // 清除所有粒子
        this.clear();
        
        // 销毁调试文本
        if (this.debugText && this.debugText.destroy) {
            this.debugText.destroy();
        }
    }
    
    /**
     * 获取效果信息 - 返回当前效果的统计信息
     */
    getInfo() {
        return {
            particleCount: this.particles.length,  // 当前粒子数量
            nextSpawnIn: Math.max(0, this.config.spawnInterval - this.spawnTimer), // 距离下次生成的时间
            active: this.active                    // 是否激活
        };
    }
}

// 导出DriftEffect类，使其可以被其他模块导入使用
export default DriftEffect;