// =============================================
// JoyPop 游戏全局配置
// =============================================

export const GAME_CONFIG = {
  width: 450,
  height: 800,
  backgroundColor: '#ff9ff3',
};

// 游戏方块类型 (混合：水果 + 宝石 + 动物)
export const TILE_TYPES = [
  { id: 0, key: 'tile_strawberry', emoji: '🍓', color: 0xff4757, name: '草莓' },
  { id: 1, key: 'tile_grape',      emoji: '🍇', color: 0x9c27b0, name: '葡萄' },
  { id: 2, key: 'tile_orange',     emoji: '🍊', color: 0xff9800, name: '橙子' },
  { id: 3, key: 'tile_blueberry',  emoji: '🫐', color: 0x3f88c5, name: '蓝莓' },
  { id: 4, key: 'tile_watermelon', emoji: '🍉', color: 0x4caf50, name: '西瓜' },
  { id: 5, key: 'tile_cherry',     emoji: '🍒', color: 0xe91e63, name: '樱桃' },
  { id: 6, key: 'tile_diamond',    emoji: '💎', color: 0x00bcd4, name: '钻石' },
  { id: 7, key: 'tile_crystal',    emoji: '🔮', color: 0x7c4dff, name: '水晶' },
];

// 特殊方块类型
export const SPECIAL_TILE = {
  STRIPED_H: 'striped_h',   // 横向条纹
  STRIPED_V: 'striped_v',   // 纵向条纹
  BOMB: 'bomb',              // 炸弹 (3x3)
  RAINBOW: 'rainbow',        // 彩虹球 (消全色)
  SUPER: 'super',            // 超级炸弹 (5x5)
};

// 棋盘配置
export const BOARD_CONFIG = {
  cols: 7,
  rows: 7,
  tileSize: 56,
  tileGap: 4,
  boardPaddingX: 16,
  boardOffsetY: 160,
};

// 关卡目标类型
export const OBJECTIVE_TYPE = {
  CLEAR_COUNT: 'clear_count',     // 消除指定数量
  CLEAR_COLOR: 'clear_color',     // 消除指定颜色
  BREAK_ICE: 'break_ice',         // 打破冰块
  BREAK_CAGE: 'break_cage',       // 打破铁笼
  COLLECT_ITEM: 'collect_item',   // 收集道具
  REACH_SCORE: 'reach_score',     // 达到分数
};

// 道具类型
export const BOOSTER_TYPE = {
  HAMMER:   { id: 'hammer',   emoji: '🔨', name: '锤子',   desc: '消除任意一块' },
  SHUFFLE:  { id: 'shuffle',  emoji: '🔀', name: '重排',   desc: '重新混排棋盘' },
  EXTRA:    { id: 'extra',    emoji: '⏰', name: '加步',   desc: '增加5步' },
  RAINBOW:  { id: 'rainbow',  emoji: '🌈', name: '彩虹',   desc: '消除周围5×5' },
  PET_SKILL:{ id: 'pet',      emoji: '🐰', name: '宠物技', desc: '宠物专属技能' },
};

// 章节配置
export const CHAPTERS = [
  {
    id: 1,
    name: '籁蛋园',
    subtitle: '甜蜜糕点乐园',
    emoji: '🥚',
    color: '#ff9f5a',
    gradientFrom: '#ffb88c',
    gradientTo: '#ffd3a8',
    levels: [1, 10],
    npc: 'train',
  },
  {
    id: 2,
    name: '冰雪山',
    subtitle: '晶莹冰雪世界',
    emoji: '❄️',
    color: '#74c0fc',
    gradientFrom: '#a8d8ff',
    gradientTo: '#d4eeff',
    levels: [11, 20],
    npc: 'fairy',
  },
  {
    id: 3,
    name: '海底潜水',
    subtitle: '神秘深海宝藏',
    emoji: '🌊',
    color: '#20c997',
    gradientFrom: '#63e6be',
    gradientTo: '#a8f5e2',
    levels: [21, 30],
    npc: 'bunny',
  },
  {
    id: 4,
    name: '樱花森林',
    subtitle: '梦幻粉樱秘境',
    emoji: '🌸',
    color: '#cc5de8',
    gradientFrom: '#e599f7',
    gradientTo: '#f3d9fa',
    levels: [31, 40],
    npc: 'fairy',
  },
  {
    id: 5,
    name: '星空城堡',
    subtitle: '闪耀梦幻星城',
    emoji: '✨',
    color: '#7950f2',
    gradientFrom: '#9775fa',
    gradientTo: '#d0bfff',
    levels: [41, 50],
    npc: 'all',
  },
];

// 成就系统
export const ACHIEVEMENTS = [
  { id: 'first_win',   name: '初出茅庐', desc: '完成第1关',    emoji: '🌟', condition: { type: 'level', value: 1 } },
  { id: 'ten_win',     name: '小有成就', desc: '完成第10关',   emoji: '⭐', condition: { type: 'level', value: 10 } },
  { id: 'fifty_win',   name: '消消达人', desc: '完成第50关',   emoji: '🏆', condition: { type: 'level', value: 50 } },
  { id: 'combo5',      name: '连击高手', desc: '达成5连击',    emoji: '🔥', condition: { type: 'combo', value: 5 } },
  { id: 'combo10',     name: '连击大师', desc: '达成10连击',   emoji: '💥', condition: { type: 'combo', value: 10 } },
  { id: 'three_star',  name: '完美主义', desc: '3星通关10关',  emoji: '💫', condition: { type: 'three_star', value: 10 } },
  { id: 'pet_lv5',     name: '萌宠好友', desc: '宠物升到5级',  emoji: '🐰', condition: { type: 'pet_level', value: 5 } },
  { id: 'daily_7',     name: '每日打卡', desc: '连续签到7天',  emoji: '📅', condition: { type: 'checkin', value: 7 } },
];

// 宠物配置
export const PET_CONFIG = {
  maxLevel: 10,
  evolutionLevels: [1, 3, 7],  // 进化里程碑等级
  maxHunger: 100,
  maxClean: 100,
  maxMood: 100,
  hungerDecayRate: 10,   // 每小时减少
  cleanDecayRate: 8,
  moodDecayRate: 5,
  feedReward: 20,
  bathReward: 25,
  playReward: 15,
  expPerLevel: 100,
};

// 音效键名
export const AUDIO_KEYS = {
  BGM_MENU: 'bgm_menu',
  BGM_CH1:  'bgm_ch1',
  BGM_CH2:  'bgm_ch2',
  SFX_MATCH: 'sfx_match',
  SFX_POP1: 'sfx_pop1',
  SFX_POP2: 'sfx_pop2',
  SFX_COMBO: 'sfx_combo',
  SFX_WIN: 'sfx_win',
  SFX_FAIL: 'sfx_fail',
  SFX_STAR: 'sfx_star',
  SFX_BOOSTER: 'sfx_booster',
  SFX_SPECIAL: 'sfx_special',
};

// 体力系统
export const HEART_CONFIG = {
  maxHearts: 5,
  rechargeMinutes: 30,
};

// 分数配置
export const SCORE_CONFIG = {
  baseMatch3: 60,
  baseMatch4: 120,
  baseMatch5: 200,
  comboMultiplier: 1.5,
};
