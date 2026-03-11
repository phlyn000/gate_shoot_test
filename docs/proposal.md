# 游戏策划案

## 一、游戏概述
- **游戏名称**：末日征途：王牌连队 (Last War: Ace Corps)
- **游戏类型**：跑酷 + 益智射击 + 策略增量
- **目标平台**：移动端（竖屏）
- **核心玩法**：玩家操控一名初始士兵在长桥/公路上自动奔跑，通过左右滑动经过带有数学运算符号（+、-、×、÷）的“数值门”来增加或减少士兵数量。同时，士兵会自动射击前方的障碍桶和敌群，收集掉落的武器升级道具。最终目标是组建规模最大的连队，击败关底的巨型Boss（坦克或变异巨人）。

## 二、游戏风格
- **美术风格**：Q版3D卡通风格，低多边形建模（Low Poly）
- **色彩基调**：亮蓝色（友方）、鲜红色（敌方/减益）、明黄色（特效/数值反馈）
- **整体氛围**：快节奏、爽快射击、数字增长的解压感

## 三、游戏首页设计（独立场景）

### 3.1 首页布局
- **游戏名称艺术字**：居中上方，采用金属质感+迷彩底色的“Last War”字体。
- **背景展示**：展示动态的军营或跨海大桥远景，有微风吹过旗帜的效果。
- **角色展示**：初始的小蓝帽士兵在画面中央做待机动画（擦枪或挥手）。
- **开始游戏按钮**：正下方醒目的黄色或橙色大按钮。
- **功能按钮**：左下角设置图标，右下角商城（更换士兵皮肤）。

### 3.2 首页资源
| 资源类型 | 说明 |
|---------|------|
| 首页背景 | 宁静的军事基地背景，有跑道和直升机，远景为大海 |
| 游戏Logo | 金属拉丝质感的“LAST WAR”美术字 |
| 首页按钮 | 复古军事UI风格，圆角矩形，质感硬朗 |

### 3.3 首页交互
- **点击"开始游戏"**：镜头快速拉近至士兵背后，无缝切换到主玩法场景。
- **点击"皮肤/商城"**：打开侧边栏，可预览不同职业的士兵（如喷火兵、机枪手）。

## 四、核心玩法系统

### 4.1 玩家控制
- **移动方式**：左右滑动屏幕（Slide to Move），控制整个方阵左右平移。
- **攻击方式**：自动射击。士兵会向正前方距离最近的障碍物或敌人发射子弹。
- **特殊技能**：拾取路面上的特殊武器（如AK47图标或火焰喷射器图标）后，短时间内改变子弹形态和伤害频率。

### 4.2 战斗系统
- **伤害类型**：
    - 弹道伤害：子弹击中木桶或敌人消耗其生命值。
    - 碰撞伤害：士兵直接撞击红色门或敌人会扣除士兵数量。
- **数值门机制**：
    - 蓝色门：加法或乘法，增加队列人数。
    - 红色门：减法或除法，减少队列人数。
- **碰撞检测**：检测子弹与障碍物、士兵与数值门、士兵与敌人的碰撞框。

### 4.3 胜负判定
- **胜利条件**：到达终点，且在Boss（坦克/巨人）触碰到最后一名士兵前将其血条清零。
- **失败条件**：士兵数量降至0，或Boss成功撞击玩家方阵。
- **结算展示**：关卡进度、最终连队人数、获得的金币奖励。

### 4.4 数值系统
- **初始士兵数**：1
- **基础射速**：每秒2发子弹/每人士兵
- **移动灵敏度**：1.2（确保能快速左右横移）
- **木桶血量**：5 - 500不等（随距离增加）
- **Boss血量**：通常为玩家当前理想士兵数的10-20倍。

## 五、资源清单（AI 生图用）

### 5.1 资源列表

| 类型 | 资源 key | 名称 | AI 生图描述 |
|-----|---------|------|------------|
| **首页背景** | bg_home | 首页军事背景 | Military base runway, ocean view in distance, sunny day, cartoon style, NO characters, NO text |
| **游戏Logo** | logo_game | 游戏Logo | "LAST WAR" text art, heavy metallic texture, military style, 3D render, white background, NO background |
| **首页按钮** | btn_start | 开始按钮 | Tactical yellow rectangular button, 3D cartoon style, glossy, transparent background, NO text |
| 主玩法背景 | bg_main | 跨海大桥路面 | Endless highway bridge over blue sea, asphalt road texture, top-down perspective, NO characters |
| 角色 | char_soldier_blue | 蓝帽小兵 | Small cute soldier, blue helmet, blue uniform, holding a small gun, 3D cartoon style, front view, white background |
| 敌人 | enemy_minion_red | 红帽小兵 | Small angry soldier, red helmet, red uniform, 3D cartoon style, front view, white background |
| 敌人 | enemy_boss_tank | 巨型坦克 | Gigantic stylized sci-fi tank, blue and silver armor, dual cannons, 3D cartoon style, front view, white background |
| 敌人 | enemy_boss_giant | 肌肉巨人 | Giant muscular man in red tank top, angry expression, 3D cartoon style, front view, white background |
| 道具 | gate_plus | 蓝色加法门 | Rectangular glowing blue gate, "+10" floating (or empty center), futuristic frame, white background, NO text |
| 道具 | gate_minus | 红色减号门 | Rectangular glowing red gate, "-5" floating (or empty center), futuristic frame, white background, NO text |
| 道具 | item_barrel | 障碍木桶 | Wooden barrel with iron bands, 3D cartoon style, centered, white background, NO text |
| 道具 | item_ak47 | 武器升级图标 | AK47 rifle icon, stylized cartoon, gold border, white background, NO text, NO labels |
| 道具 | item_flamethrower| 喷火器图标 | Flame thrower icon, fire symbol, stylized cartoon, white background, NO text, NO labels |
| 特效资源 | vfx_muzzle_flash | 枪口火光 | Cartoon muzzle flash, yellow and orange, simple shape, transparent background |
| UI | ui_health_bar | 血条框架 | Empty futuristic health bar frame, grey and silver, transparent background, NO text inside |

## 六、技能系统

| 技能名 | 触发方式 | 效果 |
|-------|---------|-----|
| 强化子弹 | 拾取AK47道具 | 射程增加50%，单发伤害翻倍，持续10秒 |
| 火焰扫射 | 拾取喷火器道具 | 射程变短但具有120度扇形AOE伤害，持续8秒 |
| 连队护盾 | 数值门暴击触发 | 队列产生短暂无敌光圈，无视碰撞减员一次 |

## 七、UI/HUD 设计
- **血量条**：Boss头顶显示红色长条，伴随数字跳动。
- **人数显示**：玩家方阵上方显示“Total: 120”数字。
- **进度条**：屏幕最上方，显示当前位置到终点Boss的距离。
- **结算界面**：大字“VICTORY”或“DEFEAT”，下方列出收集的金币。

## 八、音效方向
- **背景音乐**：激昂的军乐鼓点，快节奏。
- **音效**：
    - 射击声：高频率的皮卡皮卡电子射击声。
    - 过门声：清脆的“叮”一声（加法）或沉闷的“咚”（减法）。
    - 爆炸声：木桶和坦克炸裂时的Q版爆破音。

## 九、技术规格
### 9.1 分辨率
- **游戏分辨率**：竖屏 720x1280 (9:16)

### 9.2 AI 生图尺寸
| 资源类型 | AI 输出尺寸 |
|---------|-----------|
| 背景 | 竖屏 768x1376 |
| 其他 | 1024x1024 |

## 十、功能验收清单

### 首页场景
- [ ] 首页背景和Logo正常分层加载。
- [ ] 点击“开始”后有平滑的镜头推进效果。

### 主玩法场景
- [ ] 左右滑动灵敏度适中，无延迟感。
- [ ] 穿过蓝色门后，士兵模型瞬间克隆生成并加入方阵。
- [ ] 穿过红色门后，方阵后排士兵消失，特效反馈明显。
- [ ] 士兵数量显示实时更新。
- [ ] Boss血量扣除逻辑与玩家射速匹配。

### 通用验收
- [ ] 帧率稳定在 60FPS。
- [ ] 广告触发点（如过关翻倍）逻辑正常。