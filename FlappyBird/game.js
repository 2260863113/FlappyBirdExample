// game.js - 小游戏主入口文件
import { startGame } from './js/main.js';

// 小游戏启动
let gameInstance = null;

// 启动游戏函数
function launchGame() {
  console.log('小游戏启动中...');
  
  // 确保 Phaser 已加载
  if (typeof Phaser === 'undefined') {
    console.error('Phaser 未加载，请检查 libs 目录');
    wx.showModal({
      title: '游戏启动失败',
      content: '游戏引擎加载失败，请重试',
      showCancel: false
    });
    return;
  }
  
  // 销毁旧实例
  if (gameInstance) {
    console.log('销毁旧游戏实例');
    try {
      gameInstance.destroy(true);
    } catch (e) {
      console.warn('销毁旧实例失败:', e);
    }
    gameInstance = null;
  }
  
  // 创建新实例
  try {
    gameInstance = startGame();
    console.log('游戏启动成功');
  } catch (error) {
    console.error('游戏启动失败:', error);
    wx.showModal({
      title: '游戏启动失败',
      content: error.message || '未知错误',
      showCancel: false
    });
  }
}

// 小游戏生命周期
wx.onShow(() => {
  console.log('小游戏显示');
  if (!gameInstance) {
    // 延迟启动，确保 Canvas 准备就绪
    setTimeout(launchGame, 300);
  }
});

wx.onHide(() => {
  console.log('小游戏隐藏');
  // 可以在这里暂停游戏逻辑
  if (gameInstance && gameInstance.isPaused !== undefined) {
    try {
      gameInstance.pause();
    } catch (e) {
      console.warn('暂停游戏失败:', e);
    }
  }
});

wx.onError((error) => {
  console.error('小游戏错误:', error);
});

// 游戏重新启动
wx.onRestart(() => {
  console.log('小游戏重新启动');
  launchGame();
});

// 监听系统事件
wx.onMemoryWarning(() => {
  console.warn('收到内存警告');
  // 可以在这里释放一些资源
});

wx.onAudioInterruptionBegin(() => {
  console.log('音频中断开始');
  // 暂停游戏音频
});

wx.onAudioInterruptionEnd(() => {
  console.log('音频中断结束');
  // 恢复游戏音频
});

// 导出
export default {
  onLaunch: function() {
    console.log('小游戏初始化完成');
  }
};