// =============================================
// JoyPop 三消核心引擎
// =============================================
import { TILE_TYPES, SPECIAL_TILE, BOARD_CONFIG, SCORE_CONFIG } from '../config/GameConfig.js';
import { OBSTACLE } from '../config/LevelData.js';

export class Board {
  constructor(scene, levelData, onScoreUpdate, onObjectiveUpdate, onCombo, onLevelEnd) {
    this.scene = scene;
    this.levelData = levelData;
    this.onScoreUpdate = onScoreUpdate;
    this.onObjectiveUpdate = onObjectiveUpdate;
    this.onCombo = onCombo;
    this.onLevelEnd = onLevelEnd;

    this.cols = BOARD_CONFIG.cols;
    this.rows = BOARD_CONFIG.rows;
    this.tileSize = BOARD_CONFIG.tileSize;
    this.gap = BOARD_CONFIG.tileGap;
    this.stepSize = this.tileSize + this.gap;

    this.totalW = this.cols * this.stepSize - this.gap;
    this.boardX = levelData.boardX !== undefined ? levelData.boardX : ((BOARD_CONFIG.width || 450) - this.totalW) / 2 + BOARD_CONFIG.boardPaddingX;
    this.boardY = BOARD_CONFIG.boardOffsetY;

    this.grid = [];        // 2D array of tile objects
    this.obstacles = [];   // 2D array of obstacle data
    this.selected = null;
    this.isAnimating = false;
    this.comboCount = 0;
    this.score = 0;
    this.movesLeft = levelData.moves;
    this.objectives = levelData.objectives.map(o => ({ ...o, done: 0 }));

    this.numTileTypes = Math.min(levelData.minTileTypes || 6, TILE_TYPES.length);

    // 棋盘容器
    this.container = scene.add.container(this.boardX, this.boardY);
    this._initObstacles();
    this._initBoard();
    this._resolveInitialMatches();
  }

  // =============================================
  //  初始化
  // =============================================
  _initObstacles() {
    this.obstacles = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null)
    );
    if (this.levelData.obstacles) {
      this.levelData.obstacles.forEach(obs => {
        if (obs.r < this.rows && obs.c < this.cols) {
          this.obstacles[obs.r][obs.c] = {
            type: obs.type || OBSTACLE.ICE,
            hp: obs.type === OBSTACLE.ICE2 || obs.type === OBSTACLE.CAGE ? 2 : 1,
          };
        }
      });
    }
  }

  _initBoard() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = this._createTileAt(r, c, true);
      }
    }
    this._refreshVisuals();
  }

  _resolveInitialMatches() {
    let attempts = 0;
    while (this._findMatches().length > 0 && attempts < 20) {
      this._shuffleBoard();
      attempts++;
    }
  }

  // =============================================
  //  方块创建 & 可视化
  // =============================================
  _createTileAt(row, col, noMatch = false) {
    let typeId;
    let attempts = 0;
    do {
      typeId = Math.floor(Math.random() * this.numTileTypes);
      attempts++;
    } while (noMatch && attempts < 20 && this._wouldMatch(row, col, typeId));

    return {
      row,
      col,
      typeId,
      special: null,  // SPECIAL_TILE 值
      gameObj: null,  // Phaser GameObject
      highlighted: false,
    };
  }

  _wouldMatch(row, col, typeId) {
    // 横向检查
    if (col >= 2 &&
      this.grid[row][col - 1]?.typeId === typeId &&
      this.grid[row][col - 2]?.typeId === typeId) return true;
    // 纵向检查
    if (row >= 2 &&
      this.grid[row - 1]?.[col]?.typeId === typeId &&
      this.grid[row - 2]?.[col]?.typeId === typeId) return true;
    return false;
  }

  _refreshVisuals() {
    const scene = this.scene;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.grid[r][c];
        if (!tile) continue;
        const x = c * this.stepSize + this.tileSize / 2;
        const y = r * this.stepSize + this.tileSize / 2;
        if (tile.gameObj) {
          tile.gameObj.destroy();
        }
        tile.gameObj = this._makeTileObj(scene, tile, x, y);
        this._addTileInteraction(tile);
      }
    }
    this._drawObstacleVisuals();
    this._drawBoardBg();
  }

  _makeTileObj(scene, tile, x, y) {
    const size = this.tileSize;
    const tileType = TILE_TYPES[tile.typeId];
    const container = scene.add.container(x, y);

    // 1. 奶油白单元格背景 (森林圆润软盘风格)
    const bg = scene.add.graphics();
    bg.fillStyle(0xfffef9, 0.97);
    bg.fillRoundedRect(-size/2 + 1.5, -size/2 + 1.5, size - 3, size - 3, 14);
    
    // 内置圆润白高光
    bg.fillStyle(0xffffff, 0.5);
    bg.fillEllipse(-size/6, -size/4, size/2.5, size/4.5);

    // 2. 温暖的浅粉橙木质描边
    const border = scene.add.graphics();
    border.lineStyle(2.5, 0xffdcb9, 1);
    border.strokeRoundedRect(-size/2 + 1.5, -size/2 + 1.5, size - 3, size - 3, 14);

    // 3. 水果/宝石高保真图片居中展示
    const textureKey = scene.textures.exists(tileType.key) ? tileType.key : 'star_gold';
    const fruitSprite = scene.add.image(0, 0, textureKey);
    fruitSprite.setDisplaySize(size - 8, size - 8);

    // 4. 特殊方块标记及霓虹背景光晕
    if (tile.special) {
      const glowRing = scene.add.graphics();
      let glowColor = 0xffffff;
      if (tile.special === SPECIAL_TILE.BOMB) glowColor = 0xffa500;
      else if (tile.special === SPECIAL_TILE.STRIPED_H) glowColor = 0xff4757;
      else if (tile.special === SPECIAL_TILE.STRIPED_V) glowColor = 0x339af0;
      else if (tile.special === SPECIAL_TILE.RAINBOW) glowColor = 0xff00ff;

      glowRing.fillStyle(glowColor, 0.28);
      glowRing.fillCircle(0, 0, size / 2 - 2);
      container.add(glowRing);

      scene.tweens.add({
        targets: glowRing,
        scaleX: 1.18, scaleY: 1.18,
        alpha: 0.05,
        duration: 850,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut'
      });

      const specialIndicator = this._makeSpecialIndicator(scene, tile.special, size);
      container.add([bg, border, fruitSprite, specialIndicator]);
      this._addSpecialEffects(scene, tile, specialIndicator, size);
    } else {
      container.add([bg, border, fruitSprite]);
    }

    container.setSize(size, size);
    this.container.add(container);
    return container;
  }

  _addSpecialEffects(scene, tile, indicator, size) {
    scene.tweens.killTweensOf(indicator);

    switch (tile.special) {
      case SPECIAL_TILE.STRIPED_H:
      case SPECIAL_TILE.STRIPED_V:
        scene.tweens.add({
          targets: indicator,
          scaleX: 1.12, scaleY: 1.12,
          alpha: 0.85,
          duration: 700,
          yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut'
        });
        break;
      case SPECIAL_TILE.BOMB:
        scene.tweens.add({
          targets: indicator,
          scaleX: 1.16, scaleY: 1.16,
          duration: 450,
          yoyo: true, repeat: -1,
          ease: 'Cubic.easeInOut'
        });
        break;
      case SPECIAL_TILE.RAINBOW:
        scene.tweens.add({
          targets: indicator,
          angle: 360,
          duration: 3500,
          repeat: -1
        });
        break;
    }
  }

  _makeSpecialIndicator(scene, specialType, size) {
    const g = scene.add.graphics();
    switch (specialType) {
      case SPECIAL_TILE.STRIPED_H:
        // 红白条纹糖果圈
        g.fillStyle(0xff4757, 0.75);
        g.fillCircle(0, 0, size/3);
        g.lineStyle(2.5, 0xffffff, 1);
        g.strokeCircle(0, 0, size/3);
        break;
      case SPECIAL_TILE.STRIPED_V:
        // 蓝白条纹糖果圈
        g.fillStyle(0x339af0, 0.75);
        g.fillCircle(0, 0, size/3);
        g.lineStyle(2.5, 0xffffff, 1);
        g.strokeCircle(0, 0, size/3);
        break;
      case SPECIAL_TILE.BOMB:
        // Q萌黑炸弹
        g.fillStyle(0x2d3436, 0.95);
        g.fillCircle(0, 0, size/3);
        // 闪闪引信
        g.lineStyle(2, 0xffd43b, 1);
        g.lineBetween(0, -size/3, size/4, -size/2);
        break;
      case SPECIAL_TILE.RAINBOW:
        // 七彩星芒棒棒糖
        const colors = [0xff4757, 0xff9800, 0xffd43b, 0x4caf50, 0x3f88c5, 0x9c27b0];
        g.fillStyle(0xffffff, 0.35);
        g.fillCircle(0, 0, size/2.3);
        colors.forEach((c, i) => {
          g.fillStyle(c, 0.95);
          g.fillCircle(
            Math.cos(i/colors.length * Math.PI*2) * size/4,
            Math.sin(i/colors.length * Math.PI*2) * size/4,
            6
          );
        });
        break;
    }
    return g;
  }

  _drawBoardBg() {
    if (this.boardBg) { this.boardBg.destroy(); }
    const scene = this.scene;
    const w = this.cols * this.stepSize - this.gap + 20;
    const h = this.rows * this.stepSize - this.gap + 20;
    const bg = scene.add.graphics();

    // 适配 Mockup 的温暖粉奶油大底框
    bg.fillStyle(0xfff5f6, 1);
    bg.fillRoundedRect(-10, -10, w, h, 20);
    // 粗粉红边框
    bg.lineStyle(4.5, 0xffb3d9, 1);
    bg.strokeRoundedRect(-10, -10, w, h, 20);

    this.boardBg = bg;
    this.container.addAt(bg, 0);
  }

  _drawObstacleVisuals() {
    if (this.obstacleLayer) {
      this.obstacleLayer.forEach(o => o?.destroy());
    }
    this.obstacleLayer = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const obs = this.obstacles[r][c];
        if (!obs) continue;
        const x = c * this.stepSize + this.tileSize / 2;
        const y = r * this.stepSize + this.tileSize / 2;
        const g = this.scene.add.graphics();
        switch (obs.type) {
          case OBSTACLE.ICE:
            g.fillStyle(0x74c0fc, 0.5);
            g.fillRoundedRect(x-this.tileSize/2+3, y-this.tileSize/2+3, this.tileSize-6, this.tileSize-6, 12);
            g.lineStyle(3, 0xa8d8ff, 0.9);
            g.strokeRoundedRect(x-this.tileSize/2+3, y-this.tileSize/2+3, this.tileSize-6, this.tileSize-6, 12);
            break;
          case OBSTACLE.ICE2:
            g.fillStyle(0x339af0, 0.6);
            g.fillRoundedRect(x-this.tileSize/2+3, y-this.tileSize/2+3, this.tileSize-6, this.tileSize-6, 12);
            g.lineStyle(4, 0x74c0fc, 1);
            g.strokeRoundedRect(x-this.tileSize/2+3, y-this.tileSize/2+3, this.tileSize-6, this.tileSize-6, 12);
            break;
          case OBSTACLE.CAGE:
            g.lineStyle(4, 0x666666, 1);
            const hs = this.tileSize/2-4;
            for (let i=-hs; i<=hs; i+=12) {
              g.lineBetween(x+i, y-hs, x+i, y+hs);
              g.lineBetween(x-hs, y+i, x+hs, y+i);
            }
            g.lineStyle(5, 0x444444, 1);
            g.strokeRoundedRect(x-this.tileSize/2+2, y-this.tileSize/2+2, this.tileSize-4, this.tileSize-4, 8);
            break;
        }
        this.obstacleLayer.push(g);
        this.container.add(g);
      }
    }
  }

  // =============================================
  //  交互处理
  // =============================================
  _addTileInteraction(tile) {
    if (!tile.gameObj) return;
    tile.gameObj
      .setInteractive()
      .on('pointerdown', () => this._onTileDown(tile))
      .on('pointerover', () => this._onTileOver(tile));
  }

  _onTileDown(tile) {
    if (this.isAnimating || this.movesLeft <= 0) return;
    if (!this.selected) {
      this._selectTile(tile);
    } else if (this.selected === tile) {
      this._deselectTile();
    } else if (this._isAdjacent(this.selected, tile)) {
      this._trySwap(this.selected, tile);
    } else {
      this._deselectTile();
      this._selectTile(tile);
    }
  }

  _onTileOver(tile) {
    if (!this.selected || this.isAnimating) return;
    if (this._isAdjacent(this.selected, tile)) {
      this._trySwap(this.selected, tile);
    }
  }

  _selectTile(tile) {
    this.selected = tile;
    this.scene.tweens.add({
      targets: tile.gameObj,
      scaleX: 1.15, scaleY: 1.15,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });
  }

  _deselectTile() {
    if (this.selected?.gameObj) {
      this.scene.tweens.killTweensOf(this.selected.gameObj);
      this.scene.tweens.add({
        targets: this.selected.gameObj,
        scaleX: 1, scaleY: 1,
        duration: 100,
      });
    }
    this.selected = null;
  }

  _isAdjacent(a, b) {
    return (Math.abs(a.row - b.row) + Math.abs(a.col - b.col)) === 1;
  }

  // =============================================
  //  核心三消逻辑
  // =============================================
  async _trySwap(tileA, tileB) {
    this._deselectTile();
    this.isAnimating = true;

    await this._animateSwap(tileA, tileB);
    this._swapData(tileA, tileB);

    let isRainbowSwap = false;
    let rainbowTile = null;
    let swappedTile = null;
    if (tileA.special === SPECIAL_TILE.RAINBOW) {
      isRainbowSwap = true;
      rainbowTile = tileA;
      swappedTile = tileB;
    } else if (tileB.special === SPECIAL_TILE.RAINBOW) {
      isRainbowSwap = true;
      rainbowTile = tileB;
      swappedTile = tileA;
    }

    let matches = this._findMatches();

    if (isRainbowSwap) {
      rainbowTile.swappedColorId = swappedTile.typeId;
      if (!matches.includes(rainbowTile)) {
        matches.push(rainbowTile);
      }
    } else if (tileA.special && tileB.special) {
      // Swapping two special tiles: trigger both!
      if (!matches.includes(tileA)) matches.push(tileA);
      if (!matches.includes(tileB)) matches.push(tileB);
    }

    if (matches.length === 0) {
      // 无匹配，还原
      await this._animateSwap(tileA, tileB);
      this._swapData(tileA, tileB);
      this.isAnimating = false;
      return;
    }

    // 消耗步数
    this.movesLeft--;
    this.comboCount = 0;
    await this._processMatches(matches);
    this.isAnimating = false;
    this._checkLevelEnd();
  }

  _swapData(tileA, tileB) {
    [tileA.row, tileB.row] = [tileB.row, tileA.row];
    [tileA.col, tileB.col] = [tileB.col, tileA.col];
    this.grid[tileA.row][tileA.col] = tileA;
    this.grid[tileB.row][tileB.col] = tileB;
  }

  async _animateSwap(tileA, tileB) {
    const posA = { x: tileA.col * this.stepSize + this.tileSize/2, y: tileA.row * this.stepSize + this.tileSize/2 };
    const posB = { x: tileB.col * this.stepSize + this.tileSize/2, y: tileB.row * this.stepSize + this.tileSize/2 };
    return new Promise(resolve => {
      let done = 0;
      this.scene.tweens.add({
        targets: tileA.gameObj, x: posB.x, y: posB.y, duration: 180, ease: 'Power2',
        onComplete: () => { if (++done === 2) resolve(); }
      });
      this.scene.tweens.add({
        targets: tileB.gameObj, x: posA.x, y: posA.y, duration: 180, ease: 'Power2',
        onComplete: () => { if (++done === 2) resolve(); }
      });
    });
  }

  async _processMatches(presetMatches = null) {
    let matches = presetMatches || this._findMatches();
    while (matches.length > 0) {
      this.comboCount++;
      if (this.comboCount > 1 && this.onCombo) {
        this.onCombo(this.comboCount);
      }

      // 递归激活特殊方块以展开消除集
      this._resolveSpecialActivations(matches);

      // 计分
      const scoreGain = this._calcScore(matches);
      this.score += scoreGain;
      this.onScoreUpdate?.(this.score);

      // 更新目标
      this._updateObjectives(matches);

      // 生成特殊方块
      const specials = this._detectSpecialGeneration(matches);

      // 消除动画
      await this._animatePop(matches);

      // 移除方块
      this._removeTiles(matches);

      // 生成特殊方块到空出的格子中
      specials.forEach(s => {
        const matchedTile = matches.find(t => t.row === s.row && t.col === s.col);
        const typeId = matchedTile ? matchedTile.typeId : Math.floor(Math.random() * this.numTileTypes);
        
        this.grid[s.row][s.col] = {
          row: s.row,
          col: s.col,
          typeId: typeId,
          special: s.special,
          gameObj: null,
          highlighted: false,
        };
        this._refreshTileVisual(s.row, s.col);
      });

      // 处理障碍物
      this._damageObstaclesAround(matches);

      // 下落 & 填充
      await this._dropTiles();
      await this._fillBoard();

      // 再找匹配（连锁消除）
      matches = this._findMatches();
    }
  }

  _resolveSpecialActivations(matches) {
    const activated = new Set();
    let index = 0;
    while (index < matches.length) {
      const tile = matches[index];
      if (tile && tile.special && !activated.has(tile)) {
        activated.add(tile);
        this._drawSpecialActivationEffect(tile);
        const affected = [];
        this._activateSpecial(tile, affected);
        affected.forEach(affTile => {
          if (affTile && !matches.includes(affTile)) {
            matches.push(affTile);
          }
        });
      }
      index++;
    }
  }

  _drawSpecialActivationEffect(tile) {
    if (!tile.gameObj) return;
    const x = tile.col * this.stepSize + this.tileSize / 2;
    const y = tile.row * this.stepSize + this.tileSize / 2;

    // Play special sound effect safely
    try {
      this.scene.sound.play('sfx_special', { volume: 0.6 });
    } catch (e) {
      console.warn("Could not play sfx_special:", e);
    }

    switch (tile.special) {
      case SPECIAL_TILE.STRIPED_H: {
        const laser = this.scene.add.graphics();
        laser.x = 0;
        laser.y = y;
        const width = this.cols * this.stepSize - this.gap;
        laser.fillStyle(0xff4757, 0.85);
        laser.fillRect(0, -10, width, 20);
        laser.fillStyle(0xffffff, 0.95);
        laser.fillRect(0, -3, width, 6);
        this.container.add(laser);
        this.scene.tweens.add({
          targets: laser,
          scaleY: 2.8,
          alpha: 0,
          duration: 400,
          ease: 'Cubic.easeOut',
          onComplete: () => laser.destroy()
        });
        break;
      }
      case SPECIAL_TILE.STRIPED_V: {
        const laser = this.scene.add.graphics();
        laser.x = x;
        laser.y = 0;
        const height = this.rows * this.stepSize - this.gap;
        laser.fillStyle(0x339af0, 0.85);
        laser.fillRect(-10, 0, 20, height);
        laser.fillStyle(0xffffff, 0.95);
        laser.fillRect(-3, 0, 6, height);
        this.container.add(laser);
        this.scene.tweens.add({
          targets: laser,
          scaleX: 2.8,
          alpha: 0,
          duration: 400,
          ease: 'Cubic.easeOut',
          onComplete: () => laser.destroy()
        });
        break;
      }
      case SPECIAL_TILE.BOMB: {
        const blast = this.scene.add.graphics();
        blast.x = x;
        blast.y = y;
        blast.fillStyle(0xffa500, 0.7);
        blast.fillCircle(0, 0, this.tileSize * 1.5);
        blast.fillStyle(0xffd700, 0.5);
        blast.fillCircle(0, 0, this.tileSize * 0.8);
        this.container.add(blast);
        blast.scaleX = 0.1;
        blast.scaleY = 0.1;
        this.scene.tweens.add({
          targets: blast,
          scaleX: 1.2,
          scaleY: 1.2,
          alpha: 0,
          duration: 450,
          ease: 'Quart.easeOut',
          onComplete: () => blast.destroy()
        });
        break;
      }
      case SPECIAL_TILE.RAINBOW: {
        const wave = this.scene.add.graphics();
        wave.x = x;
        wave.y = y;
        const colors = [0xff4757, 0xff9800, 0xffd43b, 0x4caf50, 0x3f88c5, 0x9c27b0];
        colors.forEach((c, idx) => {
          wave.lineStyle(4, c, 0.9);
          wave.strokeCircle(0, 0, (idx + 1) * 12);
        });
        this.container.add(wave);
        wave.scaleX = 0.1;
        wave.scaleY = 0.1;
        this.scene.tweens.add({
          targets: wave,
          scaleX: 2.5,
          scaleY: 2.5,
          alpha: 0,
          duration: 600,
          ease: 'Cubic.easeOut',
          onComplete: () => wave.destroy()
        });
        break;
      }
    }
  }

  // =============================================
  //  匹配检测
  // =============================================
  _findMatches() {
    const matched = new Set();

    // 横向
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 2; c++) {
        const t = this.grid[r][c];
        if (!t || t.special === SPECIAL_TILE.RAINBOW) continue;
        if (this.grid[r][c+1]?.typeId === t.typeId && this.grid[r][c+2]?.typeId === t.typeId) {
          let len = 3;
          while (c+len < this.cols && this.grid[r][c+len]?.typeId === t.typeId) len++;
          for (let i = 0; i < len; i++) matched.add(this._key(r, c+i));
        }
      }
    }

    // 纵向
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 2; r++) {
        const t = this.grid[r][c];
        if (!t || t.special === SPECIAL_TILE.RAINBOW) continue;
        if (this.grid[r+1]?.[c]?.typeId === t.typeId && this.grid[r+2]?.[c]?.typeId === t.typeId) {
          let len = 3;
          while (r+len < this.rows && this.grid[r+len]?.[c]?.typeId === t.typeId) len++;
          for (let i = 0; i < len; i++) matched.add(this._key(r+i, c));
        }
      }
    }

    return [...matched].map(k => {
      const [r, c] = k.split(',').map(Number);
      return this.grid[r][c];
    }).filter(Boolean);
  }

  _key(r, c) { return `${r},${c}`; }

  // =============================================
  //  特殊方块生成检测
  // =============================================
  _detectSpecialGeneration(matches) {
    const results = [];
    // 找连续相同颜色的组
    const groups = this._groupMatches(matches);
    groups.forEach(group => {
      const len = group.length;
      const center = group[Math.floor(group.length / 2)];
      if (len >= 5) {
        // 5连 → 彩虹球
        results.push({ row: center.row, col: center.col, special: SPECIAL_TILE.RAINBOW });
      } else if (len === 4) {
        // 4连 → 条纹（方向取决于对齐方式）
        const isHorizontal = group[0].row === group[1].row;
        results.push({ row: center.row, col: center.col, special: isHorizontal ? SPECIAL_TILE.STRIPED_H : SPECIAL_TILE.STRIPED_V });
      }
    });
    // L/T型 → 炸弹
    this._detectLT(matches).forEach(pos => {
      results.push({ row: pos.row, col: pos.col, special: SPECIAL_TILE.BOMB });
    });
    return results;
  }

  _groupMatches(matches) {
    const groups = [];
    const visited = new Set();
    matches.forEach(tile => {
      if (visited.has(tile)) return;
      const group = [];
      const queue = [tile];
      while (queue.length) {
        const t = queue.shift();
        if (visited.has(t)) continue;
        visited.add(t);
        group.push(t);
        matches.filter(m => !visited.has(m) && m.typeId === t.typeId && this._isAdjacent(m, t))
          .forEach(m => queue.push(m));
      }
      if (group.length >= 4) groups.push(group);
    });
    return groups;
  }

  _detectLT(matches) {
    const set = new Set(matches.map(t => this._key(t.row, t.col)));
    const result = [];
    matches.forEach(t => {
      const { row: r, col: c } = t;
      // 检查是否是L/T形交叉点
      const h = set.has(this._key(r, c-1)) && set.has(this._key(r, c+1));
      const v = set.has(this._key(r-1, c)) && set.has(this._key(r+1, c));
      if (h && v) result.push({ row: r, col: c });
    });
    return result;
  }

  // =============================================
  //  特殊方块激活
  // =============================================
  _activateSpecial(tile, matches) {
    switch (tile.special) {
      case SPECIAL_TILE.STRIPED_H:
        for (let c = 0; c < this.cols; c++) {
          if (this.grid[tile.row][c]) matches.push(this.grid[tile.row][c]);
        }
        break;
      case SPECIAL_TILE.STRIPED_V:
        for (let r = 0; r < this.rows; r++) {
          if (this.grid[r][tile.col]) matches.push(this.grid[r][tile.col]);
        }
        break;
      case SPECIAL_TILE.BOMB:
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const nr = tile.row + dr, nc = tile.col + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc]) {
              matches.push(this.grid[nr][nc]);
            }
          }
        break;
      case SPECIAL_TILE.RAINBOW:
        if (tile.swappedColorId !== undefined) {
          const targetType = tile.swappedColorId;
          for (let r = 0; r < this.rows; r++)
            for (let c = 0; c < this.cols; c++)
              if (this.grid[r][c]?.typeId === targetType) matches.push(this.grid[r][c]);
        } else {
          // 消除棋盘上数量最多的颜色
          const counts = Array(TILE_TYPES.length).fill(0);
          for (let r = 0; r < this.rows; r++)
            for (let c = 0; c < this.cols; c++)
              if (this.grid[r][c]) counts[this.grid[r][c].typeId]++;
          const targetType = counts.indexOf(Math.max(...counts));
          for (let r = 0; r < this.rows; r++)
            for (let c = 0; c < this.cols; c++)
              if (this.grid[r][c]?.typeId === targetType) matches.push(this.grid[r][c]);
        }
        break;
    }
  }

  // =============================================
  //  消除动画
  // =============================================
  async _animatePop(tiles) {
    const unique = [...new Map(tiles.map(t => [this._key(t.row, t.col), t])).values()];
    return new Promise(resolve => {
      let done = 0;
      if (unique.length === 0) { resolve(); return; }
      unique.forEach(tile => {
        if (!tile.gameObj) { if (++done === unique.length) resolve(); return; }
        // 弹出效果
        this.scene.tweens.add({
          targets: tile.gameObj,
          scaleX: 1.3, scaleY: 1.3,
          duration: 80,
          yoyo: false,
          onComplete: () => {
            this.scene.tweens.add({
              targets: tile.gameObj,
              scaleX: 0, scaleY: 0,
              alpha: 0,
              duration: 150,
              ease: 'Back.easeIn',
              onComplete: () => {
                // 发射粒子
                this._spawnPopParticles(tile);
                if (++done === unique.length) resolve();
              }
            });
          }
        });
      });
    });
  }

  _spawnPopParticles(tile) {
    if (!tile.gameObj) return;
    const worldX = this.container.x + tile.gameObj.x;
    const worldY = this.container.y + tile.gameObj.y;
    const color = TILE_TYPES[tile.typeId]?.color || 0xffffff;
    
    if (tile.special === SPECIAL_TILE.BOMB) {
      // Bomb: massive explosion particles!
      for (let i = 0; i < 20; i++) {
        const size = Phaser.Math.Between(6, 12);
        const p = this.scene.add.image(worldX, worldY, 'particle_dot')
          .setDisplaySize(size, size)
          .setTint(0xffa500)
          .setDepth(200);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(150, 320);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        this.scene.tweens.add({
          targets: p,
          x: worldX + vx * 0.6,
          y: worldY + vy * 0.6 - 40,
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 400 + Math.random() * 300,
          ease: 'Cubic.easeOut',
          onComplete: () => p.destroy()
        });
      }
      for (let i = 0; i < 8; i++) {
        const star = this.scene.add.image(worldX, worldY, 'star_gold')
          .setDisplaySize(18, 18)
          .setDepth(201);
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(100, 200);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        this.scene.tweens.add({
          targets: star,
          x: worldX + vx * 0.6,
          y: worldY + vy * 0.6 - 30,
          angle: Phaser.Math.Between(-180, 180),
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 600 + Math.random() * 400,
          ease: 'Quad.easeOut',
          onComplete: () => star.destroy()
        });
      }
    } else if (tile.special === SPECIAL_TILE.STRIPED_H || tile.special === SPECIAL_TILE.STRIPED_V) {
      // Stripes: directional particle stream!
      const isH = tile.special === SPECIAL_TILE.STRIPED_H;
      const count = 12;
      for (let i = 0; i < count; i++) {
        const size = Phaser.Math.Between(5, 10);
        const pColor = isH ? 0xff4757 : 0x339af0;
        const p = this.scene.add.image(worldX, worldY, 'particle_dot')
          .setDisplaySize(size, size)
          .setTint(pColor)
          .setDepth(200);
        
        const dir = i % 2 === 0 ? 1 : -1;
        const speed = Phaser.Math.Between(120, 280);
        const vx = isH ? dir * speed : Phaser.Math.Between(-30, 30);
        const vy = isH ? Phaser.Math.Between(-30, 30) : dir * speed;
        
        this.scene.tweens.add({
          targets: p,
          x: worldX + vx * 0.5,
          y: worldY + vy * 0.5 - (isH ? 10 : 0),
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 350 + Math.random() * 250,
          ease: 'Cubic.easeOut',
          onComplete: () => p.destroy()
        });
      }
    } else if (tile.special === SPECIAL_TILE.RAINBOW) {
      // Rainbow: multi-colored sparkle burst!
      const colors = [0xff4757, 0xff9800, 0xffd43b, 0x4caf50, 0x3f88c5, 0x9c27b0];
      for (let i = 0; i < 18; i++) {
        const size = Phaser.Math.Between(5, 10);
        const pColor = colors[i % colors.length];
        const p = this.scene.add.image(worldX, worldY, 'particle_dot')
          .setDisplaySize(size, size)
          .setTint(pColor)
          .setDepth(200);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(120, 260);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        this.scene.tweens.add({
          targets: p,
          x: worldX + vx * 0.55,
          y: worldY + vy * 0.55 - 25,
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 450 + Math.random() * 250,
          ease: 'Cubic.easeOut',
          onComplete: () => p.destroy()
        });
      }
    } else {
      // Normal pop: existing behavior
      for (let i = 0; i < 8; i++) {
        const size = Phaser.Math.Between(4, 9);
        const p = this.scene.add.image(worldX, worldY, 'particle_dot')
          .setDisplaySize(size, size)
          .setTint(color)
          .setDepth(200);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(100, 240);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        this.scene.tweens.add({
          targets: p,
          x: worldX + vx * 0.45,
          y: worldY + vy * 0.45 - 35,
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 350 + Math.random() * 250,
          ease: 'Cubic.easeOut',
          onComplete: () => p.destroy()
        });
      }

      for (let i = 0; i < 3; i++) {
        const star = this.scene.add.image(worldX, worldY, 'star_gold')
          .setDisplaySize(14, 14)
          .setDepth(201);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(60, 150);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        this.scene.tweens.add({
          targets: star,
          x: worldX + vx * 0.45,
          y: worldY + vy * 0.45 - 25,
          angle: Phaser.Math.Between(-180, 180),
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 500 + Math.random() * 300,
          ease: 'Quad.easeOut',
          onComplete: () => star.destroy()
        });
      }
    }
  }

  // =============================================
  //  方块移除 & 下落
  // =============================================
  _removeTiles(matches) {
    const unique = [...new Map(matches.map(t => [this._key(t.row, t.col), t])).values()];
    unique.forEach(tile => {
      tile.gameObj?.destroy();
      this.grid[tile.row][tile.col] = null;
    });
  }

  async _dropTiles() {
    const promises = [];
    for (let c = 0; c < this.cols; c++) {
      let emptyRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c]) {
          if (r !== emptyRow) {
            const tile = this.grid[r][c];
            this.grid[emptyRow][c] = tile;
            this.grid[r][c] = null;
            tile.row = emptyRow;
            const targetY = emptyRow * this.stepSize + this.tileSize / 2;
            
            // 下落弹性参数
            const fallDuration = 200 + (emptyRow - r) * 45;
            
            promises.push(new Promise(resolve => {
              if (tile.gameObj) {
                // 1. 下落中竖向拉伸
                tile.gameObj.setScale(0.92, 1.08);
              }
              
              this.scene.tweens.add({
                targets: tile.gameObj,
                y: targetY,
                duration: fallDuration,
                ease: 'Quad.easeIn',
                onComplete: () => {
                  if (!tile.gameObj) { resolve(); return; }
                  // 2. 落地横向挤压弹起
                  this.scene.tweens.add({
                    targets: tile.gameObj,
                    scaleX: 1.16,
                    scaleY: 0.8,
                    duration: 80,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                      tile.gameObj?.setScale(1, 1);
                      resolve();
                    }
                  });
                }
              });
            }));
          }
          emptyRow--;
        }
      }
    }
    await Promise.all(promises);
  }

  async _fillBoard() {
    const promises = [];
    for (let c = 0; c < this.cols; c++) {
      let spawnOffset = 0;
      for (let r = 0; r < this.rows; r++) {
        if (!this.grid[r][c]) {
          spawnOffset++;
          const tile = this._createTileAt(r, c);
          this.grid[r][c] = tile;
          const targetX = c * this.stepSize + this.tileSize / 2;
          const targetY = r * this.stepSize + this.tileSize / 2;
          
          tile.gameObj = this._makeTileObj(this.scene, tile, targetX, -spawnOffset * this.stepSize);
          this._addTileInteraction(tile);
          
          const fallDuration = 200 + spawnOffset * 55;

          promises.push(new Promise(resolve => {
            if (tile.gameObj) {
              tile.gameObj.setScale(0.92, 1.08);
            }

            this.scene.tweens.add({
              targets: tile.gameObj,
              y: targetY,
              duration: fallDuration,
              ease: 'Quad.easeIn',
              onComplete: () => {
                if (!tile.gameObj) { resolve(); return; }
                this.scene.tweens.add({
                  targets: tile.gameObj,
                  scaleX: 1.16,
                  scaleY: 0.8,
                  duration: 80,
                  yoyo: true,
                  repeat: 1,
                  ease: 'Sine.easeInOut',
                  onComplete: () => {
                    tile.gameObj?.setScale(1, 1);
                    resolve();
                  }
                });
              }
            });
          }));
        }
      }
    }
    await Promise.all(promises);
  }

  // =============================================
  //  计分 & 目标
  // =============================================
  _calcScore(matches) {
    const len = matches.length;
    let base = len * SCORE_CONFIG.baseMatch3;
    if (len >= 5) base = len * SCORE_CONFIG.baseMatch5;
    else if (len >= 4) base = len * SCORE_CONFIG.baseMatch4;
    const combo = Math.pow(SCORE_CONFIG.comboMultiplier, this.comboCount - 1);
    return Math.floor(base * combo);
  }

  _updateObjectives(matches) {
    this.objectives.forEach(obj => {
      switch (obj.type) {
        case 'clear_count':
          obj.done += matches.length;
          break;
        case 'clear_color':
          obj.done += matches.filter(t => t.typeId === obj.target).length;
          break;
      }
      obj.done = Math.min(obj.done, obj.count);
    });
    this.onObjectiveUpdate?.(this.objectives);
  }

  _damageObstaclesAround(matches) {
    const matchSet = new Set(matches.map(t => this._key(t.row, t.col)));
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    matches.forEach(t => {
      dirs.forEach(([dr, dc]) => {
        const nr = t.row + dr, nc = t.col + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          const obs = this.obstacles[nr][nc];
          if (obs) {
            obs.hp--;
            if (obs.hp <= 0) {
              this.obstacles[nr][nc] = null;
              this._updateObstacleObjective(nr, nc, obs.type);
            }
          }
        }
      });
    });
    // 直接消除格的冰
    matches.forEach(t => {
      const obs = this.obstacles[t.row]?.[t.col];
      if (obs) {
        obs.hp--;
        if (obs.hp <= 0) {
          this.obstacles[t.row][t.col] = null;
          this._updateObstacleObjective(t.row, t.col, obs.type);
        }
      }
    });
    this._drawObstacleVisuals();
  }

  _updateObstacleObjective(r, c, obsType) {
    this.objectives.forEach(obj => {
      if (obj.type === 'break_ice' && (obsType === OBSTACLE.ICE || obsType === OBSTACLE.ICE2)) {
        obj.done = Math.min(obj.count, obj.done + 1);
      }
      if (obj.type === 'break_cage' && obsType === OBSTACLE.CAGE) {
        obj.done = Math.min(obj.count, obj.done + 1);
      }
    });
    this.onObjectiveUpdate?.(this.objectives);
  }

  // =============================================
  //  关卡结束判定
  // =============================================
  _checkLevelEnd() {
    const allDone = this.objectives.every(o => o.done >= o.count);
    if (allDone) {
      this.onLevelEnd?.('win', this.score, this._calcStars());
      return;
    }
    if (this.movesLeft <= 0) {
      this.onLevelEnd?.('lose', this.score, 0);
    }
  }

  _calcStars() {
    const allDone = this.objectives.every(o => o.done >= o.count);
    if (!allDone) return 0;
    const movesRatio = this.movesLeft / this.levelData.moves;
    if (movesRatio >= 0.4) return 3;
    if (movesRatio >= 0.15) return 2;
    return 1;
  }

  // =============================================
  //  道具使用
  // =============================================
  async useHammer(row, col) {
    const tile = this.grid[row]?.[col];
    if (!tile || this.isAnimating) return;
    this.isAnimating = true;
    await this._animatePop([tile]);
    this._removeTiles([tile]);
    this._damageObstaclesAround([tile]);
    this.score += 100;
    this.onScoreUpdate?.(this.score);
    await this._dropTiles();
    await this._fillBoard();
    this.isAnimating = false;
    this._checkLevelEnd();
  }

  shuffleBoard() {
    const tiles = [];
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.grid[r][c]) tiles.push(this.grid[r][c]);
    // Fisher-Yates
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i].typeId, tiles[j].typeId] = [tiles[j].typeId, tiles[i].typeId];
    }
    this._refreshVisuals();
  }

  _shuffleBoard() { this.shuffleBoard(); }

  _refreshTileVisual(r, c) {
    const tile = this.grid[r][c];
    if (!tile) return;
    const x = c * this.stepSize + this.tileSize / 2;
    const y = r * this.stepSize + this.tileSize / 2;
    tile.gameObj?.destroy();
    tile.gameObj = this._makeTileObj(this.scene, tile, x, y);
    this._addTileInteraction(tile);

    if (tile.special) {
      tile.gameObj.setScale(0);
      this.scene.tweens.add({
        targets: tile.gameObj,
        scaleX: 1,
        scaleY: 1,
        duration: 250,
        ease: 'Back.easeOut'
      });
    }
  }

  destroy() {
    this.container?.destroy();
    this.obstacleLayer?.forEach(o => o?.destroy());
    this.boardBg?.destroy();
  }
}
