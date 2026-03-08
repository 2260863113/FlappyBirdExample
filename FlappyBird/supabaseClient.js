// supabaseClient.js - 完整版
console.log('=== 开始加载 supabaseClient.js ===');

// 使用立即执行函数避免变量冲突
(function() {
    // 配置
    const SUPABASE_CONFIG = {
        url: 'https://qmuclbjpqigwcbifzqxy.supabase.co',
        key: 'sb_publishable_1npoheLG4hOhc66Llocc3A_2vZ-yT1Z'
    };
    
    console.log('Supabase 配置:', SUPABASE_CONFIG);
    
    // 检查 Supabase 库
    if (!window.supabase) {
        console.error('❌ Supabase 库未加载');
        return;
    }
    
    console.log('✅ Supabase 库已加载');
    
    // 创建客户端
    let supabaseClient = null;  // 注意：这里用不同的变量名
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        console.log('✅ Supabase 客户端创建成功');
    } catch (error) {
        console.error('❌ 创建 Supabase 客户端失败:', error);
        return;
    }
    
    // 工具函数
    const Utils = {
        getOrCreateplayerId() {
            let playerId = localStorage.getItem('player_id');
            if (!playerId) {
                playerId = '玩家_' + Math.floor(Math.random() * 10000);
                localStorage.setItem('player_id', playerId);
            }
            return playerId;
        },
        
        getCurrentplayerId() {
            return localStorage.getItem('player_id') || null;
        },
        
        setplayerId(name) {
            if (name && name.trim().length > 0) {
                localStorage.setItem('player_id', name.trim());
                return true;
            }
            return false;
        }
    };
    
    // 分数管理器
    const ScoreManager = {
        // 保存或更新玩家分数
        async saveScore(score, playerId = null) {
            console.log('🎮 保存分数:', score);
            
            if (!supabaseClient) {
                console.error('❌ Supabase 客户端未初始化');
                return { success: false, error: 'Supabase 未初始化' };
            }
            
            // 如果没有提供玩家名，自动获取或生成
            if (!playerId) {
                playerId = Utils.getOrCreateplayerId();
            }
            
            console.log('玩家:', playerId, '分数:', score);
            
            try {
                const { data, error } =  supabaseClient
                    .from('FlappyBirdScoreTable')
                    .upsert({
                        player_id: playerId,
                        score: score
                    }, {
                        onConflict: 'player_id'
                    });
                
                if (error) {
                    console.error('❌ 数据库错误:', error);
                    return { success: false, error: error.message };
                }
                
                console.log('✅ 分数保存成功，数据:', data);
                return { 
                    success: true, 
                    data,
                    message: `分数保存成功: ${playerId} - ${score}分`
                };
            } catch (err) {
                console.error('❌ 保存过程异常:', err);
                return { success: false, error: err.message };
            }
        },
        
        // 获取排行榜
        async getLeaderboard(limit = 10) {
            if (!supabaseClient) {
                return { success: false, error: 'Supabase 未初始化' };
            }
            
            try {
                const { data, error } = await supabaseClient
                    .from('FlappyBirdScoreTable')
                    .select('player_id, score, update_at')
                    .order('score', { ascending: false })
                    .limit(limit);
                
                if (error) throw error;
                
                return { 
                    success: true, 
                    data,
                    message: `获取排行榜前${limit}名成功`
                };
            } catch (err) {
                console.error('获取排行榜失败：', err);
                return { success: false, error: err.message };
            }
        },
        
        // 新增：查询当前玩家的分数
        async getMyScore() {
            console.log('🔍 查询当前玩家分数');
            
            if (!supabaseClient) {
                console.error('❌ Supabase 客户端未初始化');
                return { success: false, error: 'Supabase 未初始化' };
            }
            
            // 获取当前玩家名
            const playerId = Utils.getCurrentplayerId();
            if (!playerId) {
                return { 
                    success: false, 
                    error: '未找到玩家名',
                    message: '请先设置玩家名或保存一次分数'
                };
            }
            
            console.log('查询玩家:', playerId);
            
            try {
                const { data, error } = await supabaseClient
                    .from('FlappyBirdScoreTable')
                    .select('player_id, score, created_at, update_at')
                    .eq('player_id', playerId)  // 按玩家名筛选
                    .single();  // 只返回单条记录
                
                if (error) {
                    if (error.code === 'PGRST116') { // 没有找到记录
                        return { 
                            success: true, 
                            data: null,
                            message: '您还没有分数记录'
                        };
                    }
                    throw error;
                }
                
                console.log('✅ 查询成功，分数:', data.score);
                return { 
                    success: true, 
                    data,
                    message: `您的分数: ${data.score}分`
                };
            } catch (err) {
                console.error('❌ 查询失败:', err);
                return { 
                    success: false, 
                    error: err.message,
                    message: '查询分数失败'
                };
            }
        },
        
        // 新增：获取当前玩家的最高分数（简单封装）
        async getMyBestScore() {
            const result = await this.getMyScore();
            if (result.success && result.data) {
                return result.data.score;  // 直接返回分数数值
            }
            return 0;  // 如果没有记录，返回0
        }
    };
    
    // 暴露到全局
    if (typeof window !== 'undefined') {
        window.ScoreManager = ScoreManager;
        window.ScoreUtils = Utils;
        window.SupabaseConfig = SUPABASE_CONFIG;
        window.supabaseClient = supabaseClient;  // 用不同的名称
        console.log('✅ ScoreManager 已暴露到 window 对象');
    }
    
    // 测试函数
    window.testSupabase = async function() {
        console.log('🔧 测试 Supabase 连接...');
        
        if (!window.ScoreManager) {
            console.error('❌ ScoreManager 不存在');
            return;
        }
        
        try {
            const result = await ScoreManager.saveScore(Math.floor(Math.random() * 1000));
            console.log('测试保存结果:', result);
            
            if (result.success) {
                const leaderboard = await ScoreManager.getLeaderboard(3);
                if (leaderboard.success) {
                    console.log('🏆 排行榜:');
                    leaderboard.data.forEach((player, index) => {
                        console.log(`${index + 1}. ${player.player_id}: ${player.player_id === '测试玩家' ? '测试玩家' : player.player_id} - ${player.score}分`);
                    });
                }
                
                // 测试查询当前玩家分数
                const myScoreResult = await ScoreManager.getMyScore();
                console.log('查询当前玩家分数结果:', myScoreResult);
            }
        } catch (error) {
            console.error('测试失败:', error);
        }
    };
    
    console.log('✅ supabaseClient.js 加载完成');
})();