// =============================================
// JoyPop 关卡地图场景 - 视觉重构版
// =============================================
import { CHAPTERS } from '../config/GameConfig.js';
import { SaveSystem } from '../utils/SaveSystem.js';
import { APIClient } from '../utils/APIClient.js';
import { getLevel } from '../config/LevelData.js';

export class MapScene extends Phaser.Scene {
  constructor() { super({ key: 'MapScene' }); }

  init(data) {
    this.saveData = data.saveData || SaveSystem.load();
    this.currentChapter = data.chapter || 1;
  }

  create() {
    this.cameras.main.fadeIn(400);
    const chapter = CHAPTERS[this.currentChapter - 1];

    // 分割地图大图纹理帧
    this._sliceMapTexture();

    this._drawBackground(chapter);
    this._drawChapterHeader(chapter);
    this._drawLevelNodes(chapter);
    this._drawNavBar();
    this._drawBackButton();
  }

  _sliceMapTexture() {
    // 将 1024x1024 的 level_map_full 大图按左右分割为 ch1 和 ch2 两帧
    const texture = this.textures.get('level_map_full');
    if (texture && !texture.has('ch1')) {
      texture.add('ch1', 0, 0, 0, 512, 1024);
    }
    if (texture && !texture.has('ch2')) {
      texture.add('ch2', 0, 512, 0, 512, 1024);
    }
  }

  _drawBackground(chapter) {
    const { width, height } = this.cameras.main;

    // 使用设计稿分割图作为背景
    const frame = chapter.id === 1 ? 'ch1' : 'ch2';
    const bg = this.add.image(width / 2, height / 2, 'level_map_full', frame);
    bg.setDisplaySize(width, height);

    // 绘制装饰性 Emoji 飘动
    this._drawFloatingDecorations(chapter);
  }

  _drawFloatingDecorations(chapter) {
    const { width, height } = this.cameras.main;
    const decorEmojis = {
      1: ['🍰', '🧁', '🍭', '🍬', '🎂', '🌸'],
      2: ['❄️', '⛄', '🌨️', '💙', '✨', '🦋'],
    };
    const emojis = decorEmojis[chapter.id] || ['✨'];

    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(15, width - 15);
      const y = Phaser.Math.Between(130, height - 130);
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const d = this.add.text(x, y, emoji, {
        fontSize: `${Phaser.Math.Between(14, 22)}px`,
      }).setAlpha(Phaser.Math.FloatBetween(0.2, 0.5));

      this.tweens.add({
        targets: d,
        y: y - Phaser.Math.Between(15, 30),
        rotation: Phaser.Math.FloatBetween(-0.2, 0.2),
        alpha: d.alpha * 0.3,
        duration: 2500 + Math.random() * 2500,
        yoyo: true, repeat: -1,
        delay: Math.random() * 1500,
      });
    }
  }

  _drawChapterHeader(chapter) {
    const { width, height } = this.cameras.main;
    const d = this.saveData;
    const hud = this.add.graphics();

    // 1. 左上角玩家 Profile 覆盖胶囊 (自适应比例适配)
    const hudY = height * 0.055;
    const hudH = height * 0.063;
    const profW = width * 0.38;

    hud.fillStyle(0xfff4f8, 1);
    hud.lineStyle(3, 0xffb3d9, 1);
    hud.fillRoundedRect(12, hudY, profW, hudH, hudH / 2);
    hud.strokeRoundedRect(12, hudY, profW, hudH, hudH / 2);

    const avatarSize = hudH * 0.8;
    const avatarX = 12 + hudH / 2;
    const avatarY = hudY + hudH / 2;
    hud.fillStyle(0xffffff, 1);
    hud.fillCircle(avatarX, avatarY, avatarSize / 2);
    hud.strokeCircle(avatarX, avatarY, avatarSize / 2);
    this.add.text(avatarX, avatarY, '🦊', { fontSize: `${Math.floor(avatarSize * 0.6)}px` }).setOrigin(0.5);

    const lvlPill = this.add.graphics();
    lvlPill.fillStyle(0x448aff, 1);
    lvlPill.fillRoundedRect(avatarX + avatarSize/2 + 8, hudY + 6, profW - avatarSize - 24, hudH * 0.32, 8);

    this.add.text(avatarX + avatarSize/2 + 8 + (profW - avatarSize - 24)/2, hudY + 6 + (hudH * 0.32)/2, `Lv.${d.player.level}`, {
      fontSize: `${Math.floor(hudH * 0.22)}px`, fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(avatarX + avatarSize/2 + 8, hudY + hudH * 0.52, d.player.name, {
      fontSize: `${Math.floor(hudH * 0.24)}px`, fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#5a2d82',
    });

    // 2. 右上角爱心与金币胶囊 (自适应比例适配)
    const heartX = width * 0.635;
    const heartW = width * 0.17;
    const rightPillH = height * 0.046;
    const rightPillY = height * 0.040;

    hud.fillStyle(0xfff4f8, 1);
    hud.fillRoundedRect(heartX, rightPillY, heartW, rightPillH, rightPillH / 2);
    hud.strokeRoundedRect(heartX, rightPillY, heartW, rightPillH, rightPillH / 2);

    this.add.text(heartX + heartW/2, rightPillY + rightPillH/2, `❤️ ${d.player.hearts}`, {
      fontSize: `${Math.floor(rightPillH * 0.47)}px`, fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#ff4757',
    }).setOrigin(0.5);

    const coinX = width * 0.81;
    const coinW = width * 0.17;

    hud.fillStyle(0xfff4f8, 1);
    hud.fillRoundedRect(coinX, rightPillY, coinW, rightPillH, rightPillH / 2);
    hud.strokeRoundedRect(coinX, rightPillY, coinW, rightPillH, rightPillH / 2);

    this.add.text(coinX + coinW/2, rightPillY + rightPillH/2, `🪙 ${d.player.coins}`, {
      fontSize: `${Math.floor(rightPillH * 0.44)}px`, fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#ff9f5a',
    }).setOrigin(0.5);

    // 3. 章节标题横幅 (浮动在导航栏上方，Y点对应设计稿比例)
    const bannerH = height * 0.06;
    const bannerY = height * 0.78;

    const headerBg = this.add.graphics();
    headerBg.fillStyle(0xfff4f8, 0.94);
    headerBg.fillRoundedRect(60, bannerY, width - 120, bannerH, 16);
    headerBg.lineStyle(3, 0xffb3d9, 1);
    headerBg.strokeRoundedRect(60, bannerY, width - 120, bannerH, 16);

    this.add.text(width / 2, bannerY + bannerH/2, `${chapter.emoji} 第${chapter.id}章：${chapter.name}`, {
      fontSize: `${Math.floor(bannerH * 0.38)}px`, fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#5a2d82',
    }).setOrigin(0.5);
  }

  _drawLevelNodes(chapter) {
    const { width, height } = this.cameras.main;
    const maxUnlocked = this.saveData.progress.maxLevel;
    const positions = this._getLevelPositions(chapter.id);

    for (let i = 0; i < 10; i++) {
      const levelId = chapter.levels[0] + i;
      const pos = positions[i];
      if (!pos) continue;

      const nodeX = width * pos.xPct;
      const nodeY = height * pos.yPct;

      const stars = this.saveData.progress.levelStars[levelId] || 0;
      const unlocked = levelId <= maxUnlocked;
      const isCurrent = levelId === maxUnlocked;
      this._drawLevelNode(nodeX, nodeY, levelId, stars, unlocked, isCurrent);
    }
  }

  _getLevelPositions(chapterId) {
    if (chapterId === 1) {
      // 第一章：籁蛋园 (按 512x1024 原始设计稿计算百分比坐标)
      return [
        { xPct: 240 / 512, yPct: 800 / 1024 },
        { xPct: 150 / 512, yPct: 765 / 1024 },
        { xPct: 115 / 512, yPct: 680 / 1024 },
        { xPct: 150 / 512, yPct: 610 / 1024 },
        { xPct: 245 / 512, yPct: 560 / 1024 },
        { xPct: 330 / 512, yPct: 480 / 1024 },
        { xPct: 210 / 512, yPct: 400 / 1024 },
        { xPct: 120 / 512, yPct: 350 / 1024 },
        { xPct: 193 / 512, yPct: 260 / 1024 },
        { xPct: 285 / 512, yPct: 175 / 1024 },
      ];
    } else {
      // 第二章：冰雪山 / 海底 (按 512x1024 原始设计稿计算百分比坐标)
      return [
        { xPct: 245 / 512, yPct: 330 / 1024 },
        { xPct: 115 / 512, yPct: 435 / 1024 },
        { xPct: 260 / 512, yPct: 525 / 1024 },
        { xPct: 385 / 512, yPct: 590 / 1024 },
        { xPct: 193 / 512, yPct: 680 / 1024 },
        { xPct: 375 / 512, yPct: 755 / 1024 },
        { xPct: 136 / 512, yPct: 845 / 1024 },
        { xPct: 398 / 512, yPct: 922 / 1024 },
        { xPct: 205 / 512, yPct: 998 / 1024 },
        { xPct: 318 / 512, yPct: 1038 / 1024 },
      ];
    }
  }

  _drawLevelNode(x, y, levelId, stars, unlocked, isCurrent) {
    const { height } = this.cameras.main;
    // 动态圆半径，占高比例
    const radius = isCurrent ? height * 0.035 : height * 0.0275;

    if (!unlocked) {
      // 未解锁状态：灰色圆圈 + 锁
      const node = this.add.graphics();
      node.fillStyle(0xcccccc, 0.95);
      node.fillCircle(x, y, radius);
      node.lineStyle(3, 0x999999, 1);
      node.strokeCircle(x, y, radius);
      this.add.text(x, y, '🔒', { fontSize: `${Math.floor(radius * 1.05)}px` }).setOrigin(0.5);
    } else {
      // 已解锁状态：Q萌蓝色背景圆，厚边框
      if (isCurrent) {
        // 当前关卡脉冲外光晕
        const glow = this.add.graphics();
        glow.fillStyle(0x448aff, 0.25);
        glow.fillCircle(x, y, radius + 8);
        this.tweens.add({ targets: glow, scaleX: 1.18, scaleY: 1.18, alpha: 0.1, duration: 800, yoyo: true, repeat: -1 });
      }

      const nodeBg = this.add.graphics();
      nodeBg.fillStyle(0x64b5f6, 1);
      nodeBg.fillCircle(x, y, radius);
      nodeBg.lineStyle(3.5, 0x1565c0, 1);
      nodeBg.strokeCircle(x, y, radius);

      // 关卡号
      this.add.text(x, y - (stars > 0 ? radius * 0.18 : 0), `${levelId}`, {
        fontSize: `${Math.floor(radius * 1.05)}px`,
        fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#ffffff',
      }).setOrigin(0.5);

      // 星星展示
      if (stars > 0) {
        const starStr = '⭐'.repeat(stars);
        this.add.text(x, y + radius * 0.45, starStr, { fontSize: `${Math.floor(radius * 0.58)}px` }).setOrigin(0.5);
      }

      // 交互
      const hitArea = this.add.circle(x, y, radius + 4).setInteractive();
      hitArea.on('pointerdown', () => this._showLevelStartModal(levelId));
      hitArea.on('pointerover', () => this.tweens.add({ targets: nodeBg, scaleX: 1.12, scaleY: 1.12, duration: 100 }));
      hitArea.on('pointerout',  () => this.tweens.add({ targets: nodeBg, scaleX: 1, scaleY: 1, duration: 100 }));
    }
  }

  _drawNavBar() {
    const { width, height } = this.cameras.main;
    const navH = height * 0.086;

    const navItems = [
      { action: () => this.scene.start('MainMenuScene') },
      { action: () => {} },
      { action: () => this.scene.start('PetScene', { saveData: this.saveData }) },
      { action: () => {} },
      { action: () => this._showGlobalLeaderboardModal() },
    ];

    const itemW = width / navItems.length;
    navItems.forEach((item, i) => {
      const cx = itemW * i + itemW / 2;
      const cy = height * 0.908;

      const hit = this.add.rectangle(cx, cy, itemW - 4, navH).setInteractive();
      hit.on('pointerdown', item.action);
    });
  }

  _drawBackButton() {
    const { height } = this.cameras.main;
    // 覆盖在左上角 Profile 之下且不重叠
    const btnY = height * 0.135;
    const back = this.add.text(20, btnY, '← 返回首页', {
      fontSize: '12px', fontFamily: 'Nunito, sans-serif', fontStyle: 'bold',
      fill: '#ffffff',
      backgroundColor: 'rgba(90,45,130,0.4)',
      padding: { x: 8, y: 5 },
    }).setInteractive().setDepth(60);
    this.tweens.add({
      targets: back,
      alpha: 0.8,
      duration: 100,
    });

    back.on('pointerdown', () => {
      this.cameras.main.fadeOut(220);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenuScene'));
    });
  }

  async _showLevelStartModal(levelId) {
    const prevScore = this.saveData.progress.levelScores[levelId] || 0;
    const prevStars = this.saveData.progress.levelStars[levelId] || 0;
    const levelData = getLevel(levelId);

    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.width = '330px';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.textContent = `🌸 第 ${levelId} 关`;

    const objTitle = document.createElement('div');
    objTitle.style.fontWeight = 'bold';
    objTitle.style.color = '#5a2d82';
    objTitle.style.fontSize = '14px';
    objTitle.style.marginTop = '10px';
    objTitle.textContent = '🎯 通关目标';

    const objs = document.createElement('div');
    objs.style.display = 'flex';
    objs.style.justifyContent = 'center';
    objs.style.gap = '14px';
    objs.style.margin = '8px 0 14px';
    levelData.objectives.forEach(obj => {
      const item = document.createElement('div');
      item.style.background = '#fff0f8';
      item.style.padding = '6px 12px';
      item.style.borderRadius = '20px';
      item.style.border = '1.5px solid #ffb3d9';
      item.style.fontSize = '12px';
      item.style.color = '#ff6eb4';
      item.style.fontWeight = 'bold';
      item.textContent = `${obj.emoji || '🍓'} 消除 x ${obj.count}`;
      objs.appendChild(item);
    });

    const myBest = document.createElement('div');
    myBest.style.background = '#fdfbf7';
    myBest.style.border = '2px solid #ffdcb9';
    myBest.style.borderRadius = '16px';
    myBest.style.padding = '10px';
    myBest.style.margin = '10px 0';
    myBest.style.fontSize = '12px';
    myBest.style.color = '#5a2d82';
    myBest.innerHTML = `
      <div>我的历史最高分: <span style="font-weight: bold; color: #ff9f5a;">${prevScore.toLocaleString()} 分</span></div>
      <div style="font-size: 16px; margin-top: 4px;">${'⭐'.repeat(prevStars) + '☆'.repeat(3 - prevStars)}</div>
    `;

    const boardTitle = document.createElement('div');
    boardTitle.style.fontWeight = 'bold';
    boardTitle.style.color = '#5a2d82';
    boardTitle.style.fontSize = '13px';
    boardTitle.style.borderTop = '1px dashed #ffb3d9';
    boardTitle.style.paddingTop = '10px';
    boardTitle.style.marginTop = '10px';
    boardTitle.textContent = '🏆 本关排行榜 (Top 5)';

    const boardList = document.createElement('div');
    boardList.style.fontSize = '12px';
    boardList.style.color = '#9b59b6';
    boardList.style.margin = '8px 0';
    boardList.style.minHeight = '65px';
    boardList.style.maxHeight = '140px';
    boardList.style.overflowY = 'auto';
    boardList.textContent = '⏳ 排行榜加载中...';

    const startBtn = document.createElement('button');
    startBtn.className = 'modal-btn btn-primary';
    startBtn.style.width = '100%';
    startBtn.style.margin = '10px 0 6px 0';
    startBtn.textContent = '🎮 开始挑战 (消耗 ❤️ 1)';
    startBtn.onclick = () => {
      if (this.saveData.player.hearts <= 0) {
        alert('💔 体力不足！请等待回复或稍后再试。');
        return;
      }
      this.saveData.player.hearts--;
      this.saveData.player.lastHeartTime = Date.now();
      SaveSystem.save(this.saveData);

      this._hideModal();
      this.cameras.main.fadeOut(220);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { levelId, saveData: this.saveData });
      });
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.style.width = '100%';
    closeBtn.textContent = '关闭';
    closeBtn.onclick = () => this._hideModal();

    modal.appendChild(h);
    modal.appendChild(objTitle);
    modal.appendChild(objs);
    modal.appendChild(myBest);
    modal.appendChild(boardTitle);
    modal.appendChild(boardList);
    modal.appendChild(startBtn);
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const res = await APIClient.getLevelLeaderboard(levelId);
    if (res.success && res.leaderboard && res.leaderboard.length > 0) {
      boardList.innerHTML = '';
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.color = '#5a2d82';
      
      res.leaderboard.forEach((item, i) => {
        const tr = document.createElement('tr');
        tr.style.height = '26px';
        tr.style.borderBottom = '1px solid #fff0f8';
        const starsStr = '⭐'.repeat(item.stars);
        tr.innerHTML = `
          <td style="width: 25px; font-weight: bold;">${i + 1}</td>
          <td style="font-weight: bold;">${item.username}</td>
          <td style="text-align: right; color: #ff9f5a;">${starsStr}</td>
          <td style="text-align: right; font-weight: bold; color: #ff6eb4;">${item.score.toLocaleString()}</td>
        `;
        table.appendChild(tr);
      });
      boardList.appendChild(table);
    } else {
      boardList.textContent = '📭 暂无本关排名数据，抢先挑战夺魁！';
    }
  }

  async _showGlobalLeaderboardModal() {
    this._hideModal();
    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.width = '330px';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.textContent = '🏆 全球总分榜';

    const listContainer = document.createElement('div');
    listContainer.style.margin = '14px 0';
    listContainer.style.maxHeight = '200px';
    listContainer.style.overflowY = 'auto';
    listContainer.style.textAlign = 'left';
    listContainer.style.fontSize = '13px';
    listContainer.textContent = '⏳ 排行榜加载中...';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.textContent = '关闭';
    closeBtn.style.width = '100%';
    closeBtn.onclick = () => this._hideModal();

    modal.appendChild(h);
    modal.appendChild(listContainer);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const res = await APIClient.getGlobalLeaderboard();

    if (res.success && res.leaderboard && res.leaderboard.length > 0) {
      listContainer.innerHTML = '';
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.color = '#5a2d82';

      res.leaderboard.forEach((item, i) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #fff0f8';
        tr.style.height = '32px';

        const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
        
        tr.innerHTML = `
          <td style="width: 30px; font-weight: bold; text-align: center; font-size: 14px;">${rankEmoji}</td>
          <td style="font-weight: bold; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.username}</td>
          <td style="text-align: right; color: #ff9f5a; padding-right: 6px;">通关:${item.maxLevel}</td>
          <td style="text-align: right; font-weight: bold; color: #ff6eb4;">${item.totalScore.toLocaleString()}分</td>
        `;
        table.appendChild(tr);
      });
      table.appendChild(tr);
    } else {
      listContainer.textContent = '📭 暂无全球排行数据，快去通关创造纪录！';
    }
  }

  _hideModal() {
    document.getElementById('game-modal')?.remove();
  }

  shutdown() { this._hideModal(); }
}
