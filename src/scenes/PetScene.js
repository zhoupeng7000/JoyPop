// =============================================
// JoyPop 宠物场景 v4 - 修复版（按钮全部可用）
// =============================================
import { PET_CONFIG } from '../config/GameConfig.js';
import { SaveSystem } from '../utils/SaveSystem.js';
import { APIClient } from '../utils/APIClient.js';
import { ModalSystem } from '../utils/ModalSystem.js';

export class PetScene extends Phaser.Scene {
  constructor() { super({ key: 'PetScene' }); }

  init(data) {
    this.saveData = data.saveData || SaveSystem.load();
    SaveSystem.updatePetStatus(this.saveData);
  }

  create() {
    this.cameras.main.fadeIn(350);
    const { width, height } = this.cameras.main;

    // 计算布局基准（预先算好，各方法共用）
    this.NAV_H  = height * 0.09;
    this.NAV_Y  = height - this.NAV_H;
    this.BTN_Y  = this.NAV_Y - height * 0.115;
    this.BTN_W  = width * 0.27;
    this.BTN_H  = height * 0.072;

    this._drawBackground(width, height);
    this._drawTopHUD(width, height);
    this._drawStatusPanel(width, height);
    this._drawEvolutionPanel(width, height);
    this._drawPetCharacter(width, height);
    this._drawActionButtons(width, height);   // ← 三个功能按钮
    this._drawNavBar(width, height);           // ← 底部导航栏（含返回主页）
  }

  // ── 背景（仅装饰，不承担任何 UI 交互）────────
  _drawBackground(width, height) {
    if (this.textures.exists('pet_ui_bg')) {
      // PNG 只做装饰背景，所有 UI 叠在上面
      const bg = this.add.image(width / 2, height / 2, 'pet_ui_bg')
        .setDisplaySize(width, height).setDepth(0);
    } else {
      const bg = this.add.graphics().setDepth(0);
      bg.fillGradientStyle(0xffeef8, 0xffeef8, 0xe8d5ff, 0xf5e6ff, 1);
      bg.fillRect(0, 0, width, height);

      const floor = this.add.graphics().setDepth(0);
      floor.fillStyle(0xffd6b3, 0.4);
      floor.fillRect(0, height * 0.62, width, height * 0.38);

      for (let i = 0; i < 16; i++) {
        const x = Phaser.Math.Between(10, width - 10);
        const y = Phaser.Math.Between(10, height * 0.58);
        this.add.text(x, y, '🌸', { fontSize: '12px' }).setAlpha(0.18).setDepth(1);
      }
    }
  }

  // ── 顶部宠物 HUD ──────────────────────────
  _drawTopHUD(width, height) {
    const pet = this.saveData.pet;
    const cx  = width / 2;
    const hudH = height * 0.09;
    const hudW = width * 0.62;
    const hudY = 10;

    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0xffffff, 0.96);
    g.lineStyle(2.5, 0xffb3d9, 1);
    g.fillRoundedRect(cx - hudW / 2, hudY, hudW, hudH, 20);
    g.strokeRoundedRect(cx - hudW / 2, hudY, hudW, hudH, 20);

    // 名字
    this.add.text(cx - 20, hudY + hudH * 0.28,
      `🐰 ${pet.name}`, {
        fontSize: `${Math.floor(hudH * 0.26)}px`,
        fontFamily: 'Nunito', fontStyle: 'bold', fill: '#5a2d82',
      }).setOrigin(0.5).setDepth(11);

    // 等级徽章
    const lvlBg = this.add.graphics().setDepth(11);
    const lvlX  = cx + hudW * 0.22;
    lvlBg.fillStyle(0xffd43b, 1);
    lvlBg.fillRoundedRect(lvlX, hudY + 8, 46, 20, 10);
    this.add.text(lvlX + 23, hudY + 18, `Lv.${pet.level}`, {
      fontSize: '11px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#8a5a00',
    }).setOrigin(0.5).setDepth(12);

    // EXP 进度条
    const expPct = (pet.exp % PET_CONFIG.expPerLevel) / PET_CONFIG.expPerLevel;
    const barX   = cx - hudW / 2 + 16;
    const barY   = hudY + hudH * 0.64;
    const barW   = hudW - 32;
    const barH   = 9;

    const barBg = this.add.graphics().setDepth(11);
    barBg.fillStyle(0xe9d8f4, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 5);

    const barFill = this.add.graphics().setDepth(11);
    barFill.fillStyle(0xc77dff, 1);
    barFill.fillRoundedRect(barX, barY, Math.max(10, barW * expPct), barH, 5);

    this.add.text(cx, barY + barH + 7,
      `EXP: ${pet.exp % PET_CONFIG.expPerLevel} / ${PET_CONFIG.expPerLevel}`, {
        fontSize: '9px', fontFamily: 'Nunito', fill: '#9b59b6',
      }).setOrigin(0.5).setDepth(11);
  }

  // ── 左侧状态面板 ─────────────────────────
  _drawStatusPanel(width, height) {
    const pet  = this.saveData.pet;
    const bars = [
      { label: '🍓 饱食', value: pet.hunger, color: 0xff6b81 },
      { label: '🛁 清洁', value: pet.clean,  color: 0x4db6ff },
      { label: '🌈 心情', value: pet.mood,   color: 0xffd43b },
    ];

    const panelX = 12;
    const panelY = height * 0.145;
    const panelW = width * 0.38;
    const panelH = height * 0.22;

    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0xffffff, 0.96);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 18);
    g.lineStyle(2.5, 0xffb3d9, 1);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 18);

    this.add.text(panelX + panelW / 2, panelY + 12, '状态', {
      fontSize: '11px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#ff6eb4',
    }).setOrigin(0.5).setDepth(11);

    const itemH = (panelH - 28) / bars.length;
    bars.forEach((bar, i) => {
      const iy   = panelY + 26 + i * itemH;
      const tw   = panelW - 22;
      const pct  = Math.max(0, Math.min(1, bar.value / 100));

      this.add.text(panelX + 10, iy + 2, bar.label, {
        fontSize: '10px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#5a2d82',
      }).setDepth(11);

      const track = this.add.graphics().setDepth(11);
      track.fillStyle(0xf0e6ff, 1);
      track.fillRoundedRect(panelX + 10, iy + 16, tw, 7, 4);

      const fill = this.add.graphics().setDepth(11);
      fill.fillStyle(bar.color, 1);
      fill.fillRoundedRect(panelX + 10, iy + 16, Math.max(6, tw * pct), 7, 4);

      this.add.text(panelX + panelW - 10, iy + 4,
        `${Math.floor(bar.value)}%`, {
          fontSize: '9px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#9b59b6',
        }).setOrigin(1, 0).setDepth(11);
    });
  }

  // ── 右侧进化面板 ─────────────────────────
  _drawEvolutionPanel(width, height) {
    const pet    = this.saveData.pet;
    const panelW = width * 0.28;
    const panelX = width - panelW - 12;
    const panelY = height * 0.145;
    const panelH = height * 0.22;

    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0xffffff, 0.96);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 18);
    g.lineStyle(2.5, 0xffb3d9, 1);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 18);

    this.add.text(panelX + panelW / 2, panelY + 12, '进化', {
      fontSize: '11px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#ff6eb4',
    }).setOrigin(0.5).setDepth(11);

    const evos = [
      { text: '🐣 幼兔',  active: pet.level < 3 },
      { text: '🐰 萌兔',  active: pet.level >= 3 && pet.level < 7 },
      { text: '🐇 超萌兔', active: pet.level >= 7 },
    ];

    const stepH = (panelH - 30) / evos.length;
    evos.forEach((evo, i) => {
      const ey = panelY + 28 + i * stepH;
      this.add.text(panelX + panelW / 2, ey, evo.text, {
        fontSize: '10px', fontFamily: 'Nunito',
        fill: evo.active ? '#ff6eb4' : '#cccccc',
        fontStyle: evo.active ? 'bold' : 'normal',
      }).setOrigin(0.5).setDepth(11);
      if (i < 2) {
        this.add.text(panelX + panelW / 2, ey + stepH * 0.5, '↓', {
          fontSize: '10px', fill: '#ffb3d9',
        }).setOrigin(0.5).setDepth(11);
      }
    });
  }

  // ── 宠物角色（中央）────────────────────────
  _drawPetCharacter(width, height) {
    const cx    = width / 2;
    // 角色放置在面板下方、功能按钮上方的中间区域
    const charY = height * 0.525;

    // 地毯光晕
    const glow = this.add.graphics().setDepth(4);
    glow.fillStyle(0xffd6f0, 0.40);
    glow.fillEllipse(cx, charY + height * 0.09, width * 0.55, height * 0.065);

    const bunnyKey = this.textures.exists('bunny_happy') ? 'bunny_happy'
      : this.textures.exists('bunny') ? 'bunny' : null;

    if (bunnyKey) {
      this.petSprite = this.add.image(cx, charY, bunnyKey)
        .setScale(Math.min(width / 300, 1.5)).setDepth(5);
      this.tweens.add({
        targets: this.petSprite,
        scaleY: this.petSprite.scaleY * 0.95,
        duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else {
      const bunnyText = this.add.text(cx, charY, '🐰', {
        fontSize: `${Math.floor(height * 0.14)}px`,
      }).setOrigin(0.5).setDepth(5);
      this.tweens.add({
        targets: bunnyText, y: charY - 10,
        duration: 1200, yoyo: true, repeat: -1,
      });
      this.petSprite = bunnyText;
    }

    // 点击宠物区域触发互动
    const petHit = this.add.zone(cx, charY, width * 0.48, height * 0.2)
      .setInteractive().setDepth(6);
    petHit.on('pointerdown', () => this._onPetTap());
  }

  // ── 三个功能按钮（始终显式绘制）────────────
  _drawActionButtons(width, height) {
    const btnDefs = [
      { id: 'feed', x: width * 0.18, emoji: '🍓', label: '喂食', c1: 0xff6b81, c2: 0xff9eb5 },
      { id: 'bath', x: width * 0.50, emoji: '🛁', label: '洗澡', c1: 0x4db6ff, c2: 0x74c0fc },
      { id: 'play', x: width * 0.82, emoji: '🎮', label: '玩耍', c1: 0xffd43b, c2: 0xffe57c },
    ];

    const btnY = this.BTN_Y;
    const btnW = this.BTN_W;
    const btnH = this.BTN_H;
    const r    = btnH / 2;

    btnDefs.forEach(def => {
      // 投影
      const shadow = this.add.graphics().setDepth(20);
      shadow.fillStyle(0x000000, 0.14);
      shadow.fillRoundedRect(def.x - btnW / 2 + 3, btnY - btnH / 2 + 5, btnW, btnH, r);

      // 按钮主体（渐变）
      const btn = this.add.graphics().setDepth(21);
      btn.fillGradientStyle(def.c1, def.c2, def.c2, def.c1, 1);
      btn.fillRoundedRect(def.x - btnW / 2, btnY - btnH / 2, btnW, btnH, r);
      btn.lineStyle(2.5, 0xffffff, 0.80);
      btn.strokeRoundedRect(def.x - btnW / 2, btnY - btnH / 2, btnW, btnH, r);
      // 高光
      btn.fillStyle(0xffffff, 0.22);
      btn.fillEllipse(def.x, btnY - btnH / 4, btnW * 0.6, btnH * 0.38);

      // 图标 + 文字
      const icon = this.add.text(def.x, btnY - 7, def.emoji, { fontSize: '20px' })
        .setOrigin(0.5).setDepth(22);
      const lbl  = this.add.text(def.x, btnY + 12, def.label, {
        fontSize: '10px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#ffffff',
      }).setOrigin(0.5).setDepth(22);

      // 交互 Zone（depth 最高确保可点击）
      const hit = this.add.zone(def.x, btnY, btnW, btnH)
        .setInteractive({ useHandCursor: true }).setDepth(30);

      hit.on('pointerdown', () => {
        this.tweens.add({
          targets: [btn, icon, lbl],
          scaleX: 0.93, scaleY: 0.93, duration: 90, yoyo: true,
        });
        this.time.delayedCall(120, () => this._petAction(def.id));
      });
      hit.on('pointerover', () =>
        this.tweens.add({ targets: [btn, icon, lbl], scaleX: 1.06, scaleY: 1.06, duration: 80 })
      );
      hit.on('pointerout', () =>
        this.tweens.add({ targets: [btn, icon, lbl], scaleX: 1, scaleY: 1, duration: 80 })
      );
    });
  }

  // ── 底部导航栏（始终显式绘制）──────────────
  _drawNavBar(width, height) {
    const navH = this.NAV_H;
    const navY = this.NAV_Y;

    // 导航栏背景
    const bg = this.add.graphics().setDepth(80);
    bg.fillStyle(0xffffff, 0.97);
    bg.fillRoundedRect(8, navY + 3, width - 16, navH - 5, 22);
    bg.lineStyle(2.5, 0xffb3d9, 1);
    bg.strokeRoundedRect(8, navY + 3, width - 16, navH - 5, 22);

    const navItems = [
      {
        emoji: '🏠', label: '首页',
        action: () => {
          this._hideModal();
          this.cameras.main.fadeOut(220);
          this.cameras.main.once('camerafadeoutcomplete', () =>
            this.scene.start('MainMenuScene')
          );
        },
      },
      {
        emoji: '🗺️', label: '地图',
        action: () => {
          this._hideModal();
          this.cameras.main.fadeOut(220);
          this.cameras.main.once('camerafadeoutcomplete', () =>
            this.scene.start('MapScene', { saveData: this.saveData })
          );
        },
      },
      { emoji: '🐰', label: '宠物',  action: () => {} },  // 当前页
      { emoji: '🎁', label: '奖励',  action: () => ModalSystem.showDailyModal(this, this.saveData) },
      { emoji: '🏆', label: '排行',  action: () => ModalSystem.showGlobalLeaderboardModal(this) },
    ];

    const ACTIVE = 2;  // 宠物 tab
    const itemW  = (width - 16) / navItems.length;

    navItems.forEach((item, i) => {
      const cx = 8 + itemW * i + itemW / 2;
      const cy = navY + 3 + (navH - 5) / 2;

      // 激活项高亮胶囊
      if (i === ACTIVE) {
        const pill = this.add.graphics().setDepth(81);
        pill.fillStyle(0xff6eb4, 1);
        pill.fillRoundedRect(cx - 30, cy - 20, 60, 40, 20);
      }

      const col = i === ACTIVE ? '#ffffff' : '#b39ddb';
      this.add.text(cx, cy - 10, item.emoji, { fontSize: '19px' })
        .setOrigin(0.5).setDepth(82);
      this.add.text(cx, cy + 12, item.label, {
        fontSize: '9px', fontFamily: 'Nunito', fontStyle: 'bold', fill: col,
      }).setOrigin(0.5).setDepth(82);

      // 每个 tab 的独立 Zone，depth 最高
      const hit = this.add.zone(cx, cy, itemW - 4, navH - 4)
        .setInteractive({ useHandCursor: true }).setDepth(90);
      hit.on('pointerdown', item.action);
    });
  }

  // ── 宠物互动 ─────────────────────────────
  _petAction(type) {
    const { width, height } = this.cameras.main;
    const cfg = {
      feed: { label: '🍓 喂食啦，吃饱了！', stat: 'hunger', gain: PET_CONFIG.feedReward, color: '#ff6b81' },
      bath: { label: '🛁 洗香香，干净了！', stat: 'clean',  gain: PET_CONFIG.bathReward, color: '#4db6ff' },
      play: { label: '🎮 玩游戏，好开心！', stat: 'mood',   gain: PET_CONFIG.playReward, color: '#ffd43b' },
    }[type];

    if (!cfg) return;

    this.saveData.pet[cfg.stat] = Math.min(100, (this.saveData.pet[cfg.stat] || 0) + cfg.gain);
    this.saveData.pet.exp       = (this.saveData.pet.exp || 0) + 8;

    // 检查升级
    const expNeeded = this.saveData.pet.level * PET_CONFIG.expPerLevel;
    if (this.saveData.pet.exp >= expNeeded) {
      this.saveData.pet.level++;
      this._showFloatText(
        `🎉 宠物升级！Lv.${this.saveData.pet.level}`,
        width / 2, height * 0.38, '#ffd43b', 20
      );
    }

    SaveSystem.save(this.saveData);
    this._showFloatText(cfg.label, width / 2, height * 0.43, cfg.color);

    // 角色跳跃反应
    if (this.petSprite) {
      this.tweens.add({
        targets: this.petSprite,
        y: this.petSprite.y - 22,
        duration: 160, yoyo: true, ease: 'Quad.easeOut',
      });
    }

    // 延迟刷新场景
    this.time.delayedCall(550, () =>
      this.scene.restart({ saveData: this.saveData })
    );
  }

  // ── 点击宠物触发气泡 ─────────────────────
  _onPetTap() {
    const { width, height } = this.cameras.main;
    const reactions = [
      'Owo~', '摸我~', '喜欢你！', '一起玩吧！',
      '嘿嘿嘿~', '(ฅ\'ω\'ฅ)', '兔子跳跳跳~', '好开心！',
    ];
    const msg = reactions[Math.floor(Math.random() * reactions.length)];

    if (this.petSprite) {
      this.tweens.add({
        targets: this.petSprite,
        y: this.petSprite.y - 18,
        duration: 140, yoyo: true, ease: 'Quad.easeOut',
      });
    }

    const bubble = this.add.text(width / 2, height * 0.33, `💬 ${msg}`, {
      fontSize: '15px', fontFamily: 'Nunito', fontStyle: 'bold',
      fill: '#5a2d82',
      backgroundColor: 'rgba(255,255,255,0.96)',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setAlpha(0).setDepth(50);

    this.tweens.add({
      targets: bubble, alpha: 1, y: height * 0.315, duration: 240,
      onComplete: () => {
        this.tweens.add({
          targets: bubble, alpha: 0, y: height * 0.30, duration: 360, delay: 1000,
          onComplete: () => bubble.destroy(),
        });
      },
    });

    this.saveData.pet.mood = Math.min(100, (this.saveData.pet.mood || 0) + 3);
    SaveSystem.save(this.saveData);
  }

  // ── 浮动提示文字 ─────────────────────────
  _showFloatText(text, x, y, color = '#ff6eb4', fontSize = 16) {
    const t = this.add.text(x, y, text, {
      fontSize: `${fontSize}px`, fontFamily: 'Nunito', fontStyle: 'bold',
      fill: color, stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(400);
    this.tweens.add({
      targets: t, y: y - 55, alpha: 0, duration: 1200, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  shutdown()   { ModalSystem.hideModal(); }
}
