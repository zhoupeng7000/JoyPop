// =============================================
// JoyPop 统一 HTML 弹窗系统
// =============================================
import { SaveSystem } from './SaveSystem.js';
import { APIClient } from './APIClient.js';

export class ModalSystem {
  /**
   * 关闭当前弹窗
   */
  static hideModal() {
    document.getElementById('game-modal')?.remove();
  }

  /**
   * 通用基础弹窗
   */
  static showModal(scene, title, body, buttons) {
    this.hideModal();
    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.innerHTML = title;

    const p = document.createElement('p');
    p.className = 'modal-score';
    p.innerHTML = body;

    modal.appendChild(h);
    modal.appendChild(p);

    buttons.forEach(btn => {
      const b = document.createElement('button');
      b.className = `modal-btn btn-${btn.color}`;
      b.innerHTML = btn.text;
      b.onclick = btn.onClick;
      modal.appendChild(b);
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  /**
   * 每日签到弹窗
   */
  static showDailyModal(scene, saveData) {
    const check = SaveSystem.checkDailyReward(saveData);
    const streak = (saveData.dailyReward?.streak || 0) + 1;
    const content = check.available
      ? `连续签到第 ${streak} 天！<br>奖励：<img src="${scene.textures.getBase64('ui_coin')}" style="width:16px;vertical-align:middle;margin-right:4px;">${streak * 20} 金币`
      : `今日已签到 <img src="${scene.textures.getBase64('ui_icon_moves')}" style="width:16px;vertical-align:middle;"><br>明天再来哦！`;
    const btns = check.available
      ? [{ text: `<img src="${scene.textures.getBase64('ui_nav_gift')}" style="width:16px;vertical-align:middle;margin-right:4px;">领取奖励`, color: 'primary', onClick: () => {
          SaveSystem.claimDailyReward(saveData);
          this.hideModal();
          scene.scene.restart({ saveData });
        }}]
      : [{ text: '好的~', color: 'secondary', onClick: () => this.hideModal() }];
    this.showModal(scene, `<img src="${scene.textures.getBase64('ui_nav_home')}" style="width:18px;vertical-align:middle;margin-right:4px;">每日签到`, content, btns);
  }

  /**
   * 游戏成就弹窗
   */
  static showAchievementsModal(scene) {
    this.showModal(scene, `<img src="${scene.textures.getBase64('ui_nav_trophy')}" style="width:18px;vertical-align:middle;margin-right:4px;">我的成就`,
      `<img src="${scene.textures.getBase64('star_gold')}" style="width:16px;vertical-align:middle;"> 初出茅庐 - 完成第1关<br><img src="${scene.textures.getBase64('star_gold')}" style="width:16px;vertical-align:middle;"> 小有成就 - 完成第10关<br><img src="${scene.textures.getBase64('ui_status_drop')}" style="width:16px;vertical-align:middle;"> 连击高手 - 达成5连击<br><img src="${scene.textures.getBase64('ui_animal_bunny')}" style="width:16px;vertical-align:middle;"> 萌宠好友 - 宠物升到5级`,
      [{ text: '太棒了！', color: 'primary', onClick: () => this.hideModal() }]
    );
  }

  /**
   * 游戏设置弹窗
   */
  static showSettingsModal(scene) {
    this.showModal(scene, `<img src="${scene.textures.getBase64('ui_settings_btn')}" style="width:18px;vertical-align:middle;margin-right:4px;">游戏设置`,
      `背景音乐：开启<br>音效：开启<br>震动反馈：开启`,
      [
        { text: '保存', color: 'primary', onClick: () => this.hideModal() },
        { text: '取消', color: 'outline', onClick: () => this.hideModal() },
      ]
    );
  }

  /**
   * 玩家登录/注册弹窗
   */
  static showAuthModal(scene, saveData, mode = 'login') {
    this.hideModal();
    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.width = '320px';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.innerHTML = mode === 'login' ? '玩家登录' : '玩家注册';

    const form = document.createElement('div');
    form.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin:14px 0;';

    const userIn = document.createElement('input');
    userIn.type = 'text';
    userIn.placeholder = '输入玩家名称 (4-12位)';
    userIn.maxLength = 12;
    userIn.className = 'modal-input';

    const passIn = document.createElement('input');
    passIn.type = 'password';
    passIn.placeholder = '输入密码 (6-18位)';
    passIn.maxLength = 18;
    passIn.className = 'modal-input';

    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = 'color:#ff4757;font-size:11px;height:14px;font-weight:bold;';

    form.appendChild(userIn);
    form.appendChild(passIn);
    form.appendChild(errorMsg);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'modal-btn btn-primary';
    submitBtn.innerHTML = mode === 'login' ? '登录并同步' : '注册并初始化';
    submitBtn.style.cssText = 'width:100%;margin:0 0 10px 0;';

    submitBtn.onclick = async () => {
      const username = userIn.value.trim();
      const password = passIn.value;
      if (username.length < 3) { errorMsg.innerHTML = '用户名至少需要3位'; return; }
      if (password.length < 6) { errorMsg.innerHTML = '密码至少需要6位'; return; }
      submitBtn.disabled = true;
      submitBtn.innerHTML = '处理中...';
      const res = mode === 'login'
        ? await APIClient.login(username, password)
        : await APIClient.register(username, password);
      if (res.success) {
        SaveSystem.setCurrentUser(res.user.username);
        SaveSystem.save(res.saveData);
        this.hideModal();
        scene.scene.restart({ saveData: res.saveData });
      } else {
        errorMsg.innerHTML = res.message || '操作失败';
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'login' ? '🚀 登录并同步' : '🎁 注册并初始化';
      }
    };

    const switchLink = document.createElement('a');
    switchLink.href = '#';
    switchLink.style.cssText = 'color:#7950f2;font-size:12px;text-decoration:none;font-weight:bold;display:block;margin:6px 0;';
    switchLink.textContent = mode === 'login' ? '还没有账号？点击注册' : '已有账号？点击登录';
    switchLink.onclick = (e) => {
      e.preventDefault();
      this.showAuthModal(scene, saveData, mode === 'login' ? 'register' : 'login');
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = 'width:100%;margin-top:8px;';
    closeBtn.onclick = () => this.hideModal();

    modal.appendChild(h);
    modal.appendChild(form);
    modal.appendChild(submitBtn);
    modal.appendChild(switchLink);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  /**
   * 玩家个人中心弹窗
   */
  static showProfileModal(scene, saveData) {
    this.hideModal();
    const user = SaveSystem.getCurrentUser();
    const d = saveData;

    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.width = '320px';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.innerHTML = `<img src="${scene.textures.getBase64('ui_animal_fox')}" style="width:20px;vertical-align:middle;margin-right:6px;">玩家账号`;

    const info = document.createElement('div');
    info.style.cssText = 'text-align:left;margin:14px 0;color:#5a2d82;font-size:13px;line-height:1.8;';
    info.innerHTML = `
      <div style="font-weight:bold;border-bottom:2px dashed #ffb3d9;padding-bottom:6px;margin-bottom:8px;">
        当前账号: <span style="color:#ff6eb4;">${user || '游客'}</span>
      </div>
      <div>关卡进度: 第 <b>${d.progress.maxLevel}</b> 关</div>
      <div>金币余额: <b>${d.player.coins}</b></div>
      <div>剩余体力: <b>${d.player.hearts} / 5</b></div>
    `;

    const achievementsBtn = document.createElement('button');
    achievementsBtn.className = 'modal-btn btn-primary';
    achievementsBtn.style.cssText = 'width:100%;margin:0 0 8px 0;';
    achievementsBtn.innerHTML = `<img src="${scene.textures.getBase64('ui_nav_trophy')}" style="width:16px;vertical-align:middle;margin-right:4px;">我的成就`;
    achievementsBtn.onclick = () => this.showAchievementsModal(scene);

    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'modal-btn btn-secondary';
    settingsBtn.style.cssText = 'width:100%;margin:0 0 8px 0;';
    settingsBtn.innerHTML = `<img src="${scene.textures.getBase64('ui_settings_btn')}" style="width:16px;vertical-align:middle;margin-right:4px;">游戏设置`;
    settingsBtn.onclick = () => this.showSettingsModal(scene);

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'modal-btn btn-outline';
    logoutBtn.style.cssText = 'width:100%;margin:0 0 8px 0;color:#ff4757;border-color:#ffb3d9;';
    logoutBtn.innerHTML = user ? '退出登录' : '登录账号';
    logoutBtn.onclick = () => {
      if (user) {
        SaveSystem.setCurrentUser(null);
        this.hideModal();
        scene.scene.restart({ saveData: SaveSystem.load() });
      } else {
        this.showAuthModal(scene, saveData, 'login');
      }
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.style.width = '100%';
    closeBtn.textContent = '返回游戏';
    closeBtn.onclick = () => this.hideModal();

    modal.appendChild(h);
    modal.appendChild(info);
    modal.appendChild(achievementsBtn);
    modal.appendChild(settingsBtn);
    modal.appendChild(logoutBtn);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  /**
   * 全球总分排行榜弹窗
   */
  static async showGlobalLeaderboardModal(scene) {
    this.hideModal();
    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.width = '330px';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.innerHTML = `<img src="${scene.textures.getBase64('ui_nav_trophy')}" style="width:20px;vertical-align:middle;margin-right:4px;">全球总分榜`;

    const listContainer = document.createElement('div');
    listContainer.style.cssText = 'margin:14px 0;max-height:200px;overflow-y:auto;text-align:left;font-size:13px;';
    listContainer.innerHTML = '排行榜加载中...';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.textContent = '关闭';
    closeBtn.style.width = '100%';
    closeBtn.onclick = () => this.hideModal();

    modal.appendChild(h);
    modal.appendChild(listContainer);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    try {
      const res = await APIClient.getGlobalLeaderboard();
      if (res.success && res.leaderboard && res.leaderboard.length > 0) {
        listContainer.innerHTML = '';
        const table = document.createElement('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;color:#5a2d82;';
        res.leaderboard.forEach((item, i) => {
          const tr = document.createElement('tr');
          tr.style.cssText = 'border-bottom:1px solid #fff0f8;height:32px;';
          const rankEmoji = `${i + 1}`;
          tr.innerHTML = `
            <td style="width:30px;font-weight:bold;text-align:center;font-size:14px;">${rankEmoji}</td>
            <td style="font-weight:bold;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.username}</td>
            <td style="text-align:right;color:#ff9f5a;padding-right:6px;">通关:${item.maxLevel}</td>
            <td style="text-align:right;font-weight:bold;color:#ff6eb4;">${item.totalScore.toLocaleString()}分</td>
          `;
          table.appendChild(tr);
        });
        listContainer.appendChild(table);
      } else {
        listContainer.innerHTML = '暂无全球排行数据，快去通关创造纪录！';
      }
    } catch (e) {
      listContainer.innerHTML = '加载失败，请稍后重试';
    }
  }

  /**
   * 游戏导航菜单弹窗 (Image 2 设置菜单)
   */
  static showNavigationSettingsModal(scene, saveData) {
    this.hideModal();
    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.width = '300px';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.innerHTML = `<img src="${scene.textures.getBase64('ui_settings_btn')}" style="width:20px;vertical-align:middle;margin-right:6px;">游戏菜单`;

    const content = document.createElement('div');
    content.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin:14px 0;';

    // 音乐开关状态
    const musicOn = localStorage.getItem('joypop_bgm') !== 'off';
    const musicBtn = document.createElement('button');
    musicBtn.className = 'modal-btn btn-secondary';
    musicBtn.innerHTML = musicOn ? '背景音乐：开启' : '背景音乐：关闭';
    musicBtn.onclick = () => {
      const nextState = localStorage.getItem('joypop_bgm') === 'off' ? 'on' : 'off';
      localStorage.setItem('joypop_bgm', nextState);
      musicBtn.innerHTML = nextState === 'on' ? '背景音乐：开启' : '背景音乐：关闭';
      if (nextState === 'on') {
        scene.sound.play('bgm_menu', { loop: true, volume: 0.5 });
      } else {
        scene.sound.stopByKey('bgm_menu');
        scene.sound.stopAll();
      }
    };
    content.appendChild(musicBtn);

    // 导航按钮：回到主页 (仅当不在 MainMenuScene 时显示)
    if (scene.scene.key !== 'MainMenuScene') {
      const homeBtn = document.createElement('button');
      homeBtn.className = 'modal-btn btn-primary';
      homeBtn.innerHTML = `<img src="${scene.textures.getBase64('ui_nav_home')}" style="width:16px;vertical-align:middle;margin-right:4px;">回到主页`;
      homeBtn.onclick = () => {
        this.hideModal();
        scene.cameras.main.fadeOut(220);
        scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start('MainMenuScene'));
      };
      content.appendChild(homeBtn);
    }

    // 导航按钮：挑战关卡 (仅当不在 MapScene 时显示)
    if (scene.scene.key !== 'MapScene') {
      const mapBtn = document.createElement('button');
      mapBtn.className = 'modal-btn btn-primary';
      mapBtn.innerHTML = `<img src="${scene.textures.getBase64('ui_nav_map')}" style="width:16px;vertical-align:middle;margin-right:4px;">挑战关卡`;
      mapBtn.onclick = () => {
        this.hideModal();
        scene.cameras.main.fadeOut(220);
        scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start('MapScene', { saveData }));
      };
      content.appendChild(mapBtn);
    }

    // 导航按钮：宠物小屋 (仅当不在 PetScene 时显示)
    if (scene.scene.key !== 'PetScene') {
      const petBtn = document.createElement('button');
      petBtn.className = 'modal-btn btn-primary';
      petBtn.innerHTML = `<img src="${scene.textures.getBase64('ui_animal_bunny')}" style="width:16px;vertical-align:middle;margin-right:4px;">宠物小屋`;
      petBtn.onclick = () => {
        this.hideModal();
        scene.cameras.main.fadeOut(220);
        scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start('PetScene', { saveData }));
      };
      content.appendChild(petBtn);
    }

    // 每日签到
    const dailyBtn = document.createElement('button');
    dailyBtn.className = 'modal-btn btn-secondary';
    dailyBtn.innerHTML = `<img src="${scene.textures.getBase64('ui_nav_gift')}" style="width:16px;vertical-align:middle;margin-right:4px;">每日签到`;
    dailyBtn.onclick = () => {
      this.showDailyModal(scene, saveData);
    };
    content.appendChild(dailyBtn);

    // 全球排行榜
    const leadBtn = document.createElement('button');
    leadBtn.className = 'modal-btn btn-secondary';
    leadBtn.innerHTML = `<img src="${scene.textures.getBase64('ui_nav_trophy')}" style="width:16px;vertical-align:middle;margin-right:4px;">排行榜`;
    leadBtn.onclick = () => {
      this.showGlobalLeaderboardModal(scene);
    };
    content.appendChild(leadBtn);

    // 登录 / 个人中心
    const logged = SaveSystem.getCurrentUser();
    const authBtn = document.createElement('button');
    authBtn.className = 'modal-btn btn-outline';
    authBtn.innerHTML = logged ? `<img src="${scene.textures.getBase64('ui_animal_fox')}" style="width:16px;vertical-align:middle;margin-right:4px;">玩家: ${logged}` : '登录账号';
    authBtn.onclick = () => {
      if (logged) {
        this.showProfileModal(scene, saveData);
      } else {
        this.showAuthModal(scene, saveData, 'login');
      }
    };
    content.appendChild(authBtn);

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.textContent = '关闭';
    closeBtn.onclick = () => this.hideModal();

    modal.appendChild(h);
    modal.appendChild(content);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
}
