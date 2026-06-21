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
    this._drawPetBanner(width, height);        // 宠物状态横幅
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
        this.add.image(x, y, 'tile_cherry').setDisplaySize(16, 16).setAlpha(0.2).setDepth(1);
      }
    }
  }

  // ── 顶部 HUD ─────────────────────────────
  _drawTopHUD(width, height) {
    const d = this.saveData;
    const hudY = height * 0.016;
    const hudH = Math.min(38, height * 0.05);

    const margin = 8;
    const gap = 6;
    const gearSize = hudH * 1.1;

    // 设置齿轮按钮 (右上角)
    const gearX = width - margin - gearSize / 2;
    const gearY = hudY + hudH / 2;

    const gearBtn = this.add.image(gearX, gearY, 'ui_settings_btn')
      .setDisplaySize(gearSize, gearSize)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });

    gearBtn.on('pointerdown', () => {
      this.tweens.add({ targets: gearBtn, scaleX: 0.88, scaleY: 0.88, duration: 80, yoyo: true });
      this.time.delayedCall(100, () => {
        ModalSystem.showNavigationSettingsModal(this, this.saveData);
      });
    });
    gearBtn.on('pointerover', () => this.tweens.add({ targets: gearBtn, scaleX: 1.08, scaleY: 1.08, duration: 80 }));
    gearBtn.on('pointerout', () => this.tweens.add({ targets: gearBtn, scaleX: 1, scaleY: 1, duration: 80 }));

    // 计算三个胶囊的可用宽度 (金币、星星、体力)
    const availableW = gearX - gearSize / 2 - margin - gap * 3;
    const pillW = Math.floor(availableW / 3);

    const coinX = margin;
    const starX = coinX + pillW + gap;
    const heartX = starX + pillW + gap;

    // 统计星星总数
    let totalStars = 0;
    if (d.progress && d.progress.levelStars) {
      totalStars = Object.values(d.progress.levelStars).reduce((sum, s) => sum + s, 0);
    }

    // 1. 金币胶囊
    this._drawHUDCapsule(coinX, hudY, pillW, hudH, 'ui_coin', `${d.player.coins}`, () => {
      d.player.coins += 100;
      SaveSystem.save(d);
      this.scene.restart({ saveData: d });
    });

    // 2. 星星胶囊
    this._drawHUDCapsule(starX, hudY, pillW, hudH, 'star_gold', `${totalStars}`, () => {
      ModalSystem.showAchievementsModal(this);
    });

    // 3. 体力胶囊
    this._drawHUDCapsule(heartX, hudY, pillW, hudH, 'ui_heart', `${d.player.hearts}/5`, () => {
      if (d.player.hearts < 5) {
        d.player.hearts = 5;
        SaveSystem.save(d);
        this.scene.restart({ saveData: d });
      }
    });
  }

  _drawHUDCapsule(x, y, w, h, iconKey, valueText, onClickPlus) {
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x000000, 0.08);
    g.fillRoundedRect(x + 1.5, y + 2, w, h, h / 2);
    g.fillStyle(0xfffbeb, 1);
    g.fillRoundedRect(x, y, w, h, h / 2);
    g.lineStyle(2.5, 0xfcd34d, 1);
    g.strokeRoundedRect(x, y, w, h, h / 2);

    const iconSize = h * 0.9;
    const icon = this.add.image(x + h / 2 + 1, y + h / 2, iconKey)
      .setDisplaySize(iconSize, iconSize)
      .setDepth(21);

    const textX = x + h + 2;
    const text = this.add.text(textX, y + h / 2, valueText, {
      fontSize: `${Math.floor(h * 0.38)}px`,
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
      fill: '#5d4037',
    }).setOrigin(0, 0.5).setDepth(21);

    const plusSize = h * 0.85;
    const plusBtn = this.add.image(x + w - plusSize / 2 - 2, y + h / 2, 'ui_plus_btn')
      .setDisplaySize(plusSize, plusSize)
      .setDepth(22)
      .setInteractive({ useHandCursor: true });

    plusBtn.on('pointerdown', () => {
      this.tweens.add({ targets: plusBtn, scaleX: 0.85, scaleY: 0.85, duration: 80, yoyo: true });
      onClickPlus();
    });

    return [g, icon, text, plusBtn];
  }

  _drawPetBanner(width, height) {
    const pet = this.saveData.pet;
    const cx  = width / 2;
    const bannerY = height * 0.385;
    const bannerW = width * 0.76;
    const bannerH = 48;

    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0x000000, 0.12);
    g.fillRoundedRect(cx - bannerW / 2 + 2, bannerY + 2, bannerW, bannerH, 12);
    g.fillStyle(0x8d6e63, 1);
    g.fillRoundedRect(cx - bannerW / 2, bannerY, bannerW, bannerH, 12);
    g.lineStyle(2, 0xfbbf24, 1);
    g.strokeRoundedRect(cx - bannerW / 2, bannerY, bannerW, bannerH, 12);

    this.add.text(cx, bannerY + 12, `${pet.name} (Lv.${pet.level})`, {
      fontSize: '13px', fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#ffffff',
    }).setOrigin(0.5).setDepth(11);

    const barX = cx - bannerW / 2 + 20;
    const barY = bannerY + 28;
    const barW = bannerW - 40;
    const barH = 7;
    const expPct = (pet.exp % 100) / 100;

    const track = this.add.graphics().setDepth(11);
    track.fillStyle(0x3e2723, 1);
    track.fillRoundedRect(barX, barY, barW, barH, 3.5);

    const fill = this.add.graphics().setDepth(12);
    fill.fillStyle(0xffb3d9, 1);
    fill.fillRoundedRect(barX, barY, Math.max(6, barW * expPct), barH, 3.5);

    this.add.text(cx, barY + barH + 7, `EXP: ${pet.exp % 100} / 100`, {
      fontSize: '8px', fontFamily: 'Nunito, sans-serif', fill: '#ffd6e7',
    }).setOrigin(0.5).setDepth(12);
  }

  // ── 左侧状态面板 ─────────────────────────
  _drawStatusPanel(width, height) {
    const pet  = this.saveData.pet;
    const bars = [
      { id: 'hunger', label: '    饱食', value: pet.hunger, color: 0xff6b81 },
      { id: 'clean',  label: '    清洁', value: pet.clean,  color: 0x4db6ff },
      { id: 'mood',   label: '    心情', value: pet.mood,   color: 0xffd43b },
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

      // 绘制状态小图标
      if (bar.id === 'hunger') {
        this.add.image(panelX + 16, iy + 7, 'tile_strawberry').setDisplaySize(12, 12).setDepth(12);
      } else if (bar.id === 'mood') {
        this.add.image(panelX + 16, iy + 7, 'star_gold').setDisplaySize(12, 12).setDepth(12);
      } else if (bar.id === 'clean') {
        this.add.image(panelX + 16, iy + 7, 'ui_status_drop').setDisplaySize(13, 13).setDepth(12);
      }

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
      { text: '幼兔',  active: pet.level < 3 },
      { text: '萌兔',  active: pet.level >= 3 && pet.level < 7 },
      { text: '超萌兔', active: pet.level >= 7 },
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
        .setScale(Math.min(width / 400, 0.9)).setDepth(5);
      this.tweens.add({
        targets: this.petSprite,
        scaleY: this.petSprite.scaleY * 0.95,
        duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else {
      const bunnyImg = this.add.image(cx, charY, 'ui_animal_bunny').setDisplaySize(height * 0.14, height * 0.14).setDepth(5);
      this.tweens.add({
        targets: bunnyImg, y: charY - 10,
        duration: 1200, yoyo: true, repeat: -1,
      });
      this.petSprite = bunnyImg;
    }

    // 点击宠物区域触发互动
    const petHit = this.add.zone(cx, charY, width * 0.48, height * 0.2)
      .setInteractive().setDepth(6);
    petHit.on('pointerdown', () => this._onPetTap());
  }

  // ── 三个功能按钮（始终显式绘制）────────────
  _drawActionButtons(width, height) {
    const btnDefs = [
      { id: 'feed', x: width * 0.18, label: '喂食', c1: 0xff6b81, c2: 0xff9eb5 },
      { id: 'bath', x: width * 0.50, label: '洗澡', c1: 0x4db6ff, c2: 0x74c0fc },
      { id: 'play', x: width * 0.82, label: '玩耍', c1: 0xffd43b, c2: 0xffe57c },
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
      let iconObj;
      if (def.id === 'feed') {
        iconObj = this.add.image(def.x, btnY - 7, 'tile_strawberry').setDisplaySize(24, 24).setDepth(22);
      } else if (def.id === 'play') {
        iconObj = this.add.image(def.x, btnY - 7, 'star_gold').setDisplaySize(24, 24).setDepth(22);
      } else {
        iconObj = this.add.image(def.x, btnY - 7, 'ui_status_drop').setDisplaySize(24, 24).setDepth(22);
      }

      const lbl  = this.add.text(def.x, btnY + 12, def.label, {
        fontSize: '10px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#ffffff',
      }).setOrigin(0.5).setDepth(22);

      // 交互 Zone（depth 最高确保可点击）
      const hit = this.add.zone(def.x, btnY, btnW, btnH)
        .setInteractive({ useHandCursor: true }).setDepth(30);

      hit.on('pointerdown', () => {
        this.tweens.add({
          targets: [btn, iconObj, lbl],
          scaleX: 0.93, scaleY: 0.93, duration: 90, yoyo: true,
        });
        this.time.delayedCall(120, () => this._petAction(def.id));
      });
      hit.on('pointerover', () =>
        this.tweens.add({ targets: [btn, iconObj, lbl], scaleX: 1.06, scaleY: 1.06, duration: 80 })
      );
      hit.on('pointerout', () =>
        this.tweens.add({ targets: [btn, iconObj, lbl], scaleX: 1, scaleY: 1, duration: 80 })
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
        label: '首页',
        action: () => {
          this._hideModal();
          this.cameras.main.fadeOut(220);
          this.cameras.main.once('camerafadeoutcomplete', () =>
            this.scene.start('MainMenuScene')
          );
        },
      },
      {
        label: '地图',
        action: () => {
          this._hideModal();
          this.cameras.main.fadeOut(220);
          this.cameras.main.once('camerafadeoutcomplete', () =>
            this.scene.start('MapScene', { saveData: this.saveData })
          );
        },
      },
      { label: '宠物',  action: () => {} },  // 当前页
      { label: '奖励',  action: () => ModalSystem.showDailyModal(this, this.saveData) },
      { label: '排行',  action: () => ModalSystem.showGlobalLeaderboardModal(this) },
    ];

    const navTextures = ['ui_nav_home', 'ui_nav_map', 'ui_nav_pet', 'ui_nav_gift', 'ui_nav_trophy'];
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
      
      const icon = this.add.image(cx, cy - 8, navTextures[i])
        .setDisplaySize(28, 28).setDepth(82);
      icon.setAlpha(i === ACTIVE ? 1 : 0.65);

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
      feed: { label: '喂食啦，吃饱了！', stat: 'hunger', gain: PET_CONFIG.feedReward, color: '#ff6b81' },
      bath: { label: '洗香香，干净了！', stat: 'clean',  gain: PET_CONFIG.bathReward, color: '#4db6ff' },
      play: { label: '玩游戏，好开心！', stat: 'mood',   gain: PET_CONFIG.playReward, color: '#ffd43b' },
    }[type];

    if (!cfg) return;

    this.saveData.pet[cfg.stat] = Math.min(100, (this.saveData.pet[cfg.stat] || 0) + cfg.gain);
    this.saveData.pet.exp       = (this.saveData.pet.exp || 0) + 8;

    // 检查升级
    const expNeeded = this.saveData.pet.level * PET_CONFIG.expPerLevel;
    if (this.saveData.pet.exp >= expNeeded) {
      this.saveData.pet.level++;
      this._showFloatText(
        `宠物升级！Lv.${this.saveData.pet.level}`,
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

    const bubble = this.add.text(width / 2, height * 0.33, msg, {
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

  _hideModal() {
    ModalSystem.hideModal();
    const modal = document.getElementById('game-modal');
    if (modal) modal.remove();
  }

  shutdown()   { ModalSystem.hideModal(); }
}
