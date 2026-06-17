// =============================================
// JoyPop 宠物场景 - 重构视觉版
// =============================================
import { PET_CONFIG } from '../config/GameConfig.js';
import { SaveSystem } from '../utils/SaveSystem.js';
import { APIClient } from '../utils/APIClient.js';

export class PetScene extends Phaser.Scene {
  constructor() { super({ key: 'PetScene' }); }

  init(data) {
    this.saveData = data.saveData || SaveSystem.load();
    SaveSystem.updatePetStatus(this.saveData);
  }

  create() {
    this.cameras.main.fadeIn(350);

    this._drawBackground();
    this._drawTopPetHUD();
    this._drawStatusBars();
    this._drawEvolutionPanel();
    this._drawActionButtons();
    this._drawNavBar();
    this._setupPetInteraction();
  }

  _drawBackground() {
    const { width, height } = this.cameras.main;
    // 载入设计图背景
    const bg = this.add.image(width / 2, height / 2, 'pet_ui_bg');
    bg.setDisplaySize(width, height);
  }

  // ── 顶部宠物等级/名字 HUD 覆盖 ──────────────────────
  _drawTopPetHUD() {
    const { width } = this.cameras.main;
    const pet = this.saveData.pet;
    const cx = width / 2;

    // 覆盖大胶囊 (覆盖原图 消消 / LV.5)
    const g = this.add.graphics();
    g.fillStyle(0xfff4f8, 1);
    g.lineStyle(3, 0xffb3d9, 1);
    g.fillRoundedRect(cx - 100, 12, 200, 72, 20);
    g.strokeRoundedRect(cx - 100, 12, 200, 72, 20);

    // 名字 & 等级徽章
    this.add.text(cx - 20, 28, `🐰 ${pet.name}`, {
      fontSize: '16px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#5a2d82',
    }).setOrigin(0.5);

    const lvlBg = this.add.graphics();
    lvlBg.fillStyle(0xffd43b, 1);
    lvlBg.fillRoundedRect(cx + 40, 20, 42, 16, 8);
    this.add.text(cx + 61, 28, `Lv.${pet.level}`, {
      fontSize: '10px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#8a5a00',
    }).setOrigin(0.5);

    // 升级 EXP 进度条
    const expPct = (pet.exp % PET_CONFIG.expPerLevel) / PET_CONFIG.expPerLevel;
    const barX = cx - 80, barY = 52, barW = 160, barH = 10;
    
    const barBg = this.add.graphics();
    barBg.fillStyle(0xe2e6ea, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 5);

    const barFill = this.add.graphics();
    barFill.fillStyle(0xc77dff, 1);
    barFill.fillRoundedRect(barX, barY, Math.max(8, barW * expPct), barH, 5);

    this.add.text(cx, barY + 16, `EXP: ${pet.exp % PET_CONFIG.expPerLevel}/${PET_CONFIG.expPerLevel}`, {
      fontSize: '9px', fontFamily: 'Nunito', fill: '#9b59b6',
    }).setOrigin(0.5);
  }

  // ── 左侧动态状态进度条覆盖 ────────────────────────
  _drawStatusBars() {
    const { width, height } = this.cameras.main;
    const pet = this.saveData.pet;
    const bars = [
      { label: '🍓 喂食', value: pet.hunger, color: 0xff6b81 },
      { label: '🛁 清洁', value: pet.clean, color: 0x74c0fc },
      { label: '🌈 心情', value: pet.mood, color: 0xffd43b },
    ];

    const startY = height * 0.144; // ~115px at 800h
    const panelW = width * 0.322; // ~145px at 450w
    const panelH = height * 0.195; // ~156px at 800h
    const panelX = width * 0.031; // ~14px at 450w

    // 覆盖底板
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.95);
    g.fillRoundedRect(panelX, startY, panelW, panelH, 16);
    g.lineStyle(2.5, 0xffb3d9, 1);
    g.strokeRoundedRect(panelX, startY, panelW, panelH, 16);

    const itemH = (panelH - 20) / bars.length;
    bars.forEach((bar, i) => {
      const y = startY + 10 + i * itemH;
      this.add.text(panelX + 12, y, bar.label, {
        fontSize: `${Math.floor(panelH * 0.07)}px`, fontFamily: 'Nunito', fontStyle: 'bold', fill: '#5a2d82',
      });

      // 进度条背景
      const track = this.add.graphics();
      track.fillStyle(0xf0e6ff, 1);
      track.fillRoundedRect(panelX + 12, y + panelH * 0.115, panelW - 24, panelH * 0.064, 5);

      // 进度条填充
      const fill = this.add.graphics();
      const pct = bar.value / 100;
      fill.fillStyle(bar.color, 1);
      fill.fillRoundedRect(panelX + 12, y + panelH * 0.115, Math.max(6, (panelW - 24) * pct), panelH * 0.064, 5);

      // 进度数值
      this.add.text(panelX + panelW - 12, y + 6, `${Math.floor(bar.value)}%`, {
        fontSize: `${Math.floor(panelH * 0.064)}px`, fontFamily: 'Nunito', fontStyle: 'bold', fill: '#9b59b6',
      }).setOrigin(1, 0.5);
    });
  }

  // ── 右侧宠物进化预览覆盖 ─────────────────────────
  _drawEvolutionPanel() {
    const { width, height } = this.cameras.main;
    const pet = this.saveData.pet;
    
    const startY = height * 0.144; // ~115px at 800h
    const panelW = width * 0.222; // ~100px at 450w
    const panelH = height * 0.195; // ~156px at 800h
    const panelX = width - panelW - width * 0.031;

    // 覆盖右侧底板
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.95);
    g.fillRoundedRect(panelX, startY, panelW, panelH, 16);
    g.lineStyle(2.5, 0xffb3d9, 1);
    g.strokeRoundedRect(panelX, startY, panelW, panelH, 16);

    this.add.text(panelX + panelW/2, startY + panelH * 0.09, '宠物进化', {
      fontSize: `${Math.floor(panelH * 0.07)}px`, fontFamily: 'Nunito', fontStyle: 'bold', fill: '#ff6eb4',
    }).setOrigin(0.5);

    const evos = [
      { text: '🐣 幼兔', active: pet.level < 3 },
      { text: '🐰 萌兔', active: pet.level >= 3 && pet.level < 7 },
      { text: '🐇 超萌兔', active: pet.level >= 7 },
    ];

    const stepY = (panelH - 30) / evos.length;
    evos.forEach((evo, i) => {
      const y = startY + panelH * 0.24 + i * stepY;
      this.add.text(panelX + panelW/2, y, evo.text, {
        fontSize: `${Math.floor(panelH * 0.064)}px`, fontFamily: 'Nunito',
        fill: evo.active ? '#ff6eb4' : '#cccccc',
        fontStyle: evo.active ? 'bold' : 'normal',
      }).setOrigin(0.5);
      if (i < 2) {
        this.add.text(panelX + panelW/2, y + stepY * 0.5, '↓', { fontSize: `${Math.floor(panelH * 0.064)}px`, fill: '#ffb3d9' }).setOrigin(0.5);
      }
    });
  }

  // ── 底部喂食/洗澡/玩耍动作按钮 ────────────────────
  _drawActionButtons() {
    const { width, height } = this.cameras.main;
    const actions = [
      { id: 'feed', x: width * 0.178, icon: '🍓', label: '喂食' },
      { id: 'bath', x: width * 0.50,  icon: '🛁', label: '洗澡' },
      { id: 'play', x: width * 0.822, icon: '🎮', label: '玩耍' },
    ];

    const btnY = height * 0.725; // ~580px at 800h
    const btnW = width * 0.222; // ~100px at 450w
    const btnH = height * 0.0625; // ~50px at 800h

    actions.forEach(action => {
      // 按钮背景高光图层
      const glow = this.add.graphics();
      glow.fillStyle(0xffffff, 0);
      glow.fillRoundedRect(action.x - btnW/2, btnY - btnH/2, btnW, btnH, 16);

      const hit = this.add.rectangle(action.x, btnY, btnW, btnH).setInteractive();
      hit.on('pointerdown', () => {
        glow.clear();
        glow.fillStyle(0xffffff, 0.35);
        glow.fillRoundedRect(action.x - btnW/2, btnY - btnH/2, btnW, btnH, 16);
        this.time.delayedCall(120, () => {
          glow.clear();
          this._petAction(action.id);
        });
      });
      hit.on('pointerover', () => {
        glow.clear();
        glow.fillStyle(0xffffff, 0.18);
        glow.fillRoundedRect(action.x - btnW/2, btnY - btnH/2, btnW, btnH, 16);
      });
      hit.on('pointerout', () => {
        glow.clear();
      });
    });
  }

  _petAction(type) {
    const { width, height } = this.cameras.main;
    const config = {
      feed: { label: '🍓 喂食消消，吃饱了！', stat: 'hunger', gain: PET_CONFIG.feedReward, color: '#ff6b81' },
      bath: { label: '🛁 洗香香，变干净了！', stat: 'clean', gain: PET_CONFIG.bathReward, color: '#74c0fc' },
      play: { label: '🎮 玩游戏，太开心了！', stat: 'mood', gain: PET_CONFIG.playReward, color: '#ffd43b' },
    }[type];

    const old = this.saveData.pet[config.stat];
    this.saveData.pet[config.stat] = Math.min(100, old + config.gain);
    this.saveData.pet.exp = (this.saveData.pet.exp || 0) + 8;

    // 检查升级
    if (this.saveData.pet.exp >= this.saveData.pet.level * PET_CONFIG.expPerLevel) {
      this.saveData.pet.level++;
      this._showFloatText(`🎉 宠物进化升级！Lv.${this.saveData.pet.level}`, width/2, height * 0.44, '#ffd43b', 20);
    }

    SaveSystem.save(this.saveData);
    this._showFloatText(config.label, width/2, height * 0.475, config.color);
    
    // 短暂延迟后重启场景以刷新数值
    this.time.delayedCall(400, () => this.scene.restart({ saveData: this.saveData }));
  }

  // ── 宠物交互气泡 ────────────────────────────────
  _setupPetInteraction() {
    const { width, height } = this.cameras.main;

    // 添加 live 宠物小兔图片，带微弱呼吸动画
    if (this.textures.exists('bunny')) {
      this.petSprite = this.add.image(width / 2, height - 195, 'bunny').setScale(0.12).setDepth(5);
      this.tweens.add({
        targets: this.petSprite,
        scaleY: 0.115,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 交互点击区覆盖在小兔玩偶上 (armchair center x: width/2, y: height-195)
    const petHit = this.add.circle(width/2, height - 195, 70).setInteractive().setDepth(6);
    petHit.on('pointerdown', () => this._onPetTap());
  }

  _onPetTap() {
    const { width, height } = this.cameras.main;
    const reactions = ['Owo~', '摸我~', '喜欢你！', '一起玩吧！', '嘿嘿嘿~', '哼哼哼~', '(ฅ\'ω\'ฅ)', '兔子跳跳跳~'];
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];

    // 播放点击跳跃动画
    if (this.petSprite) {
      this.tweens.add({
        targets: this.petSprite,
        y: height - 225,
        duration: 150,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    }

    // 弹出交互文本气泡
    const bubble = this.add.text(width/2, height * 0.35, `💬 ${reaction}`, {
      fontSize: '15px', fontFamily: 'Nunito', fontStyle: 'bold',
      fill: '#5a2d82',
      backgroundColor: 'rgba(255,255,255,0.95)',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: bubble, alpha: 1, y: height * 0.325, duration: 250,
      onComplete: () => {
        this.tweens.add({
          targets: bubble, alpha: 0, y: height * 0.3, duration: 350, delay: 1000,
          onComplete: () => bubble.destroy()
        });
      }
    });

    this.saveData.pet.mood = Math.min(100, this.saveData.pet.mood + 3);
    SaveSystem.save(this.saveData);
  }

  _drawNavBar() {
    const { width, height } = this.cameras.main;
    const navH = height * 0.086;

    const navItems = [
      { action: () => this.scene.start('MainMenuScene') },
      { action: () => this.scene.start('MapScene', { saveData: this.saveData }) },
      { action: () => {} },
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

  _showFloatText(text, x, y, color = '#ff6eb4', fontSize = 16) {
    const t = this.add.text(x, y, text, {
      fontSize: `${fontSize}px`, fontFamily: 'Nunito', fontStyle: 'bold',
      fill: color, stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(400);
    this.tweens.add({
      targets: t, y: y - 50, alpha: 0, duration: 1200, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
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
      listContainer.appendChild(table);
    } else {
      listContainer.textContent = '📭 暂无全球排行数据，快去通关创造纪录！';
    }
  }

  _hideModal() {
    document.getElementById('game-modal')?.remove();
  }

  shutdown() { this._hideModal(); }
}
