// =============================================
// JoyPop 存档系统 (LocalStorage + Cloud Sync)
// =============================================
import { APIClient } from './APIClient.js';

const LOGGED_USER_KEY = 'joypop_logged_user';

const DEFAULT_SAVE = {
  version: '1.0.0',
  player: {
    name: '小玩家',
    level: 1,
    exp: 0,
    hearts: 5,
    lastHeartTime: null,
    coins: 100,
    gems: 5,
  },
  progress: {
    currentLevel: 1,
    maxLevel: 1,
    levelStars: {},      // { levelId: 0-3 }
    levelScores: {},     // { levelId: score }
  },
  pet: {
    name: '消消',
    level: 1,
    exp: 0,
    hunger: 80,
    clean: 90,
    mood: 85,
    lastUpdateTime: null,
    skin: 'default',
    accessories: [],
  },
  boosters: {
    hammer: 3,
    shuffle: 2,
    extra: 3,
    rainbow: 1,
    pet: 2,
  },
  dailyReward: {
    lastClaimDate: null,
    streak: 0,
  },
  achievements: [],
  settings: {
    bgmVolume: 0.6,
    sfxVolume: 0.8,
    vibration: true,
  },
};

export class SaveSystem {
  static getCurrentUser() {
    return localStorage.getItem(LOGGED_USER_KEY) || null;
  }

  static setCurrentUser(username) {
    if (username) {
      localStorage.setItem(LOGGED_USER_KEY, username);
    } else {
      localStorage.removeItem(LOGGED_USER_KEY);
    }
  }

  static getSaveKey() {
    const user = this.getCurrentUser();
    return user ? `joypop_save_${user}` : 'joypop_save_guest';
  }

  static load() {
    // 历史遗留数据迁移
    const legacy = localStorage.getItem('joypop_save');
    if (legacy && !localStorage.getItem('joypop_save_guest')) {
      localStorage.setItem('joypop_save_guest', legacy);
      localStorage.removeItem('joypop_save');
    }

    try {
      const raw = localStorage.getItem(this.getSaveKey());
      if (!raw) return this.createNew();
      const data = JSON.parse(raw);
      // 深度合并，确保新字段有默认值
      return this._deepMerge(DEFAULT_SAVE, data);
    } catch {
      return this.createNew();
    }
  }

  static save(data) {
    try {
      const key = this.getSaveKey();
      localStorage.setItem(key, JSON.stringify(data));
      
      // 异步同步至云端
      const user = this.getCurrentUser();
      if (user) {
        APIClient.saveGame(user, data);
      }
    } catch (e) {
      console.warn('[SaveSystem] 保存失败:', e);
    }
  }

  static createNew() {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_SAVE));
    const user = this.getCurrentUser();
    if (user) {
      fresh.player.name = user;
    }
    fresh.player.lastHeartTime = Date.now();
    fresh.pet.lastUpdateTime = Date.now();
    this.save(fresh);
    return fresh;
  }

  static _deepMerge(defaults, saved) {
    const result = { ...defaults };
    for (const key in saved) {
      if (saved[key] !== null && typeof saved[key] === 'object' && !Array.isArray(saved[key])) {
        result[key] = this._deepMerge(defaults[key] || {}, saved[key]);
      } else {
        result[key] = saved[key];
      }
    }
    return result;
  }

  static updateLevelResult(saveData, levelId, score, stars) {
    const prev = saveData.progress.levelStars[levelId] || 0;
    const prevScore = saveData.progress.levelScores[levelId] || 0;
    saveData.progress.levelStars[levelId] = Math.max(prev, stars);
    saveData.progress.levelScores[levelId] = Math.max(prevScore, score);
    if (levelId >= saveData.progress.maxLevel) {
      saveData.progress.maxLevel = levelId + 1;
    }
    this.save(saveData);

    // 异步上报成绩到排行榜
    const user = this.getCurrentUser();
    if (user) {
      APIClient.reportScore(user, levelId, score, stars);
    }
    return saveData;
  }

  static rechargeHearts(saveData) {
    const { maxHearts, rechargeMinutes } = { maxHearts: 5, rechargeMinutes: 30 };
    const now = Date.now();
    if (saveData.player.hearts < maxHearts) {
      const elapsed = (now - saveData.player.lastHeartTime) / 60000;
      const gained = Math.floor(elapsed / rechargeMinutes);
      if (gained > 0) {
        saveData.player.hearts = Math.min(maxHearts, saveData.player.hearts + gained);
        saveData.player.lastHeartTime = now;
        this.save(saveData);
      }
    }
    return saveData;
  }

  static updatePetStatus(saveData) {
    const now = Date.now();
    if (!saveData.pet.lastUpdateTime) {
      saveData.pet.lastUpdateTime = now;
      return saveData;
    }
    const hoursElapsed = (now - saveData.pet.lastUpdateTime) / 3600000;
    saveData.pet.hunger = Math.max(0, saveData.pet.hunger - hoursElapsed * 10);
    saveData.pet.clean  = Math.max(0, saveData.pet.clean  - hoursElapsed * 8);
    saveData.pet.mood   = Math.max(0, saveData.pet.mood   - hoursElapsed * 5);
    saveData.pet.lastUpdateTime = now;
    this.save(saveData);
    return saveData;
  }

  static checkDailyReward(saveData) {
    const today = new Date().toDateString();
    if (saveData.dailyReward.lastClaimDate === today) return { available: false };
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (saveData.dailyReward.lastClaimDate === yesterday) {
      return { available: true, streak: saveData.dailyReward.streak + 1 };
    }
    return { available: true, streak: 1 };
  }

  static claimDailyReward(saveData) {
    const check = this.checkDailyReward(saveData);
    if (!check.available) return saveData;
    saveData.dailyReward.lastClaimDate = new Date().toDateString();
    saveData.dailyReward.streak = check.streak;
    // 奖励计算（连续签到奖励递增）
    const day = Math.min(check.streak, 7);
    const coinReward = day * 20;
    const gemReward = day >= 7 ? 3 : 0;
    saveData.player.coins += coinReward;
    saveData.player.gems += gemReward;
    this.save(saveData);
    return { saveData, coinReward, gemReward, streak: check.streak };
  }
}
