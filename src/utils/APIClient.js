// =============================================
// JoyPop API 客户端 (用于前端与 Express 后端通信)
// =============================================

export class APIClient {
  /**
   * 用户注册
   */
  static async register(username, password) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return await res.json();
    } catch (e) {
      console.error('[API] 注册网络错误:', e);
      return { success: false, message: '网络连接失败，请检查后端服务是否开启' };
    }
  }

  /**
   * 用户登录
   */
  static async login(username, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return await res.json();
    } catch (e) {
      console.error('[API] 登录网络错误:', e);
      return { success: false, message: '网络连接失败，请检查后端服务是否开启' };
    }
  }

  /**
   * 读取云端存档
   */
  static async getSave(username) {
    try {
      const res = await fetch(`/api/game/save?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-username': username,
        },
      });
      return await res.json();
    } catch (e) {
      console.error('[API] 获取云端存档失败:', e);
      return { success: false, message: '读取云存档失败，转为本地模式' };
    }
  }

  /**
   * 保存云端存档
   */
  static async saveGame(username, saveData) {
    try {
      const res = await fetch('/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, saveData }),
      });
      return await res.json();
    } catch (e) {
      console.error('[API] 云端保存失败:', e);
      return { success: false, message: '同步云存档失败' };
    }
  }

  /**
   * 上报关卡成绩
   */
  static async reportScore(username, levelId, score, stars) {
    try {
      const res = await fetch('/api/game/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, levelId, score, stars }),
      });
      return await res.json();
    } catch (e) {
      console.error('[API] 成绩上报失败:', e);
      return { success: false, message: '成绩同步失败' };
    }
  }

  /**
   * 获取全球排行榜
   */
  static async getGlobalLeaderboard() {
    try {
      const res = await fetch('/api/game/leaderboard/global');
      return await res.json();
    } catch (e) {
      console.error('[API] 获取全球排行榜失败:', e);
      return { success: false, leaderboard: [] };
    }
  }

  /**
   * 获取单关排行榜
   */
  static async getLevelLeaderboard(levelId) {
    try {
      const res = await fetch(`/api/game/leaderboard/level/${levelId}`);
      return await res.json();
    } catch (e) {
      console.error(`[API] 获取关卡 ${levelId} 排行榜失败:`, e);
      return { success: false, leaderboard: [] };
    }
  }
}
