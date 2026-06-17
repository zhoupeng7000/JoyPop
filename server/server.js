import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const app = express();
const port = 3000;

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

// 默认存档模板
const DEFAULT_SAVE_TEMPLATE = {
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
    levelStars: {},
    levelScores: {},
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

// ── 数据库助手 ─────────────────────────────────────────
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const init = { users: [], scores: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2), 'utf8');
      return init;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('[DB] 读取失败，初始化空库:', e);
    return { users: [], scores: [] };
  }
}

function writeDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] 写入失败:', e);
  }
}

// ── 密码加密助手 ────────────────────────────────────────
function hashPassword(password, salt) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// ── API 端点 ──────────────────────────────────────────

// 1. 用户注册
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  const db = readDB();
  const existingUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ success: false, message: '用户名已存在' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  
  // 初始化该用户的专属云存档
  const userSave = JSON.parse(JSON.stringify(DEFAULT_SAVE_TEMPLATE));
  userSave.player.name = username;
  userSave.player.lastHeartTime = Date.now();
  userSave.pet.lastUpdateTime = Date.now();

  const newUser = {
    username,
    salt,
    passwordHash,
    saveData: userSave,
    createdAt: Date.now()
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({
    success: true,
    message: '注册成功！',
    user: { username },
    saveData: userSave
  });
});

// 2. 用户登录
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  const db = readDB();
  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(400).json({ success: false, message: '用户名或密码错误' });
  }

  const calculatedHash = hashPassword(password, user.salt);
  if (calculatedHash !== user.passwordHash) {
    return res.status(400).json({ success: false, message: '用户名或密码错误' });
  }

  res.json({
    success: true,
    message: '登录成功！',
    user: { username: user.username },
    saveData: user.saveData
  });
});

// 3. 读取存档
app.get('/api/game/save', (req, res) => {
  const username = req.headers['x-username'] || req.query.username;
  if (!username) {
    return res.status(400).json({ success: false, message: '未指定用户名' });
  }

  const db = readDB();
  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  res.json({
    success: true,
    saveData: user.saveData
  });
});

// 4. 保存存档
app.post('/api/game/save', (req, res) => {
  const { username, saveData } = req.body;
  if (!username || !saveData) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  const db = readDB();
  const userIndex = db.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  // 更新该用户的云存档
  db.users[userIndex].saveData = saveData;
  writeDB(db);

  res.json({ success: true, message: '云端同步成功' });
});

// 5. 上报单关分数
app.post('/api/game/score', (req, res) => {
  const { username, levelId, score, stars } = req.body;
  if (!username || levelId === undefined || score === undefined || stars === undefined) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  const db = readDB();
  
  // 1. 记录关卡成绩条目
  const newScore = {
    username,
    levelId: parseInt(levelId),
    score: parseInt(score),
    stars: parseInt(stars),
    timestamp: Date.now()
  };
  
  db.scores.push(newScore);

  // 2. 联调更新用户云存档 progress 下的数据，确保两边强一致
  const userIndex = db.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (userIndex !== -1) {
    const user = db.users[userIndex];
    const prevScore = user.saveData.progress.levelScores[levelId] || 0;
    const prevStars = user.saveData.progress.levelStars[levelId] || 0;

    user.saveData.progress.levelScores[levelId] = Math.max(prevScore, score);
    user.saveData.progress.levelStars[levelId] = Math.max(prevStars, stars);
    
    // 如果完成了最高关卡，自动解锁下一关
    if (levelId >= user.saveData.progress.maxLevel) {
      user.saveData.progress.maxLevel = levelId + 1;
    }
  }

  writeDB(db);
  res.json({ success: true, message: '分数上报成功' });
});

// 6. 全球总积分排行榜 (合并所有单关最高分的总和)
app.get('/api/game/leaderboard/global', (req, res) => {
  const db = readDB();
  
  const leaderboard = db.users.map(user => {
    const levelScores = user.saveData?.progress?.levelScores || {};
    const totalScore = Object.values(levelScores).reduce((sum, val) => sum + val, 0);
    const maxLevel = user.saveData?.progress?.maxLevel || 1;
    return {
      username: user.username,
      totalScore,
      maxLevel: maxLevel - 1 // maxLevel 表示已解锁的最大关卡，减 1 表示最高通关数
    };
  });

  // 按总分降序排列
  leaderboard.sort((a, b) => b.totalScore - a.totalScore);

  res.json({
    success: true,
    leaderboard: leaderboard.slice(0, 10)
  });
});

// 7. 单关排行榜
app.get('/api/game/leaderboard/level/:levelId', (req, res) => {
  const levelId = parseInt(req.params.levelId);
  if (isNaN(levelId)) {
    return res.status(400).json({ success: false, message: '无效的关卡 ID' });
  }

  const db = readDB();
  const levelScores = db.scores.filter(s => s.levelId === levelId);

  // 对每个玩家去重只保留最高分
  const bestScores = {};
  levelScores.forEach(s => {
    if (!bestScores[s.username] || bestScores[s.username].score < s.score) {
      bestScores[s.username] = s;
    }
  });

  const sorted = Object.values(bestScores).sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    leaderboard: sorted.slice(0, 5).map(s => ({
      username: s.username,
      score: s.score,
      stars: s.stars,
      timestamp: s.timestamp
    }))
  });
});

app.listen(port, () => {
  console.log(`[JoyPop Backend] Server is running at http://localhost:${port}`);
});
