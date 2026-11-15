# 完整手工验收清单

自动检查：在仓库根目录运行 `npm ci`、`npm run check`。截图对照资料与原始操作记录见 [基准说明](../baseline/README.md)。

## 呈现

在干净的浏览器站点数据中运行 `npm run dev`，等待字体与最初两条机器人消息加载完毕。浏览器保持默认缩放，依次设置桌面 `1440×900`、平板 `1024×768`、手机 `390×844`。桌面和平板确认 Design Map 是常驻中央主工作区，Journal 与 Preview 各自能隐藏和恢复；手机确认底部 Journal、Board、Preview 导航可切换，隐藏其中一栏后仍能从 Board 恢复。检查输入框、顶部项目菜单和滚动区域没有被遮挡。Canvas 随机元素、Logo 动画和打字动画按行为核对。

## 开场与第一版草稿

1. 将机器人命名为 `Bolt`。开场卡片显示三个问题（Who is in your game? / What does the character do? / How do you want players to feel?）和可折叠的 `Already have a game idea? Tell us about it!` 描述框。输入 `a cat`，点选 `collecting stars` 和 `💪 challenged`，点击 `✨ Make my first draft!`。
2. 确认聊天说明这是第一版草稿、孩子是设计者；标题自动变为 `Cat: Collecting Stars`。设计地图的九个元素都有便签：角色和动作是孩子自己的话，其余带 ✨ 标记。地图上有带标签的箭头，至少包含 `bombs fall from the sky → if the cat touches a bomb, it loses 1 life → 3 lives → show the score at the end`。右侧立即显示可试玩的 `v1`，不出现预测问答；底部显示 `The game matches your map`。
3. 新建项目，展开描述框输入 `A cat catches stars. When bombs fall, the stars come faster and faster. You have 3 lives. The sky is purple.`，不填问题，直接点击 `✨ Make my first draft!`。确认描述中的机制作为孩子自己的便签出现（无 ✨），两条 CONFLICT 便签之间有 `if → then` 箭头，无法归类的 `The sky is purple` 在聊天中列出。再新建项目只描述 `Bombs fall from the sky.`，确认机器人只询问缺少的问题 1 和 2，填写后描述中的机制一并加入草稿。
4. 点击 `Save`，从顶部 `Projects` 菜单创建新项目，再从同一菜单加载旧项目；核对名称、对话、便签、箭头和 `v1`。改名机器人及重新开始入口也应可从项目菜单打开。关闭并重新打开同一站点，确认项目仍在。

## 设计地图

1. 九个元素以不同颜色的区块显示在同一画布上，CHARACTERS 在左上角。拖动空白处平移，使用 `−`、`+` 和 `Fit` 缩放；拖动区块标题移动区块，箭头随之移动；点击 `▾` 收起区块，箭头改连到区块标题。上下拖动便签可在同一区块内调整顺序。保存并重新载入后，区块位置、收起状态和便签顺序保留。
2. 点击 `bombs fall from the sky`：它和直接相连的便签以黄色高亮，后续受影响的便签及箭头以橙色虚线高亮，其余便签变淡但仍可见。右侧面板显示连接（可改标签或用 × 删除）和 `A change here also affects` 列表。点击元素名称时，该区块及与之相连的便签高亮。按 Esc 或点击空白处取消选中。
3. 点击区块的 `＋`，输入新想法并 `Add to map`；新便签标记 `new`，底部显示 `1 change not in the game yet`。在面板点击 `🔗 Connect to…`，再点击另一区块的便签，确认出现跨元素箭头；尝试连接自己和重复连接，确认被阻止。编辑一条 ✨ 便签，确认它变为 `✏️ My idea`、保留原有箭头，且只算一处改动。删除一条便签，确认相关箭头一同移除。
4. 点击 `▶ Update my game`，选择一项预测并点击 `I think so!`。确认右侧更新为 `v2`，`new` 标记消失，底部显示 `The game matches your map`。点击 `Undo`，确认地图（包括箭头）和游戏返回 `v1`。

## Code 视图

1. 在右侧面板切换到 `</> Code`，未选中便签时显示整段游戏程序，按九个元素分组，最后是 RULES。选中 `if the cat touches a bomb, it loses 1 life`，或在便签面板点击 `</> See the code`：只显示这张便签的程序行（黄色标记），下面是 `What it does` 的说明和 `Inside the game engine` 中 `engine.js` 的碰撞检测与生命减少两行。手机上点击 `See the code` 会切换到 Preview 标签并打开 Code。
2. 在 CONFLICT 添加 `the stars come faster and faster`，再把 `bombs fall from the sky` 连接到它。确认 Code 中出现 `when("hero is hit", then.goFaster());`，加速那一行变为 `// waits for a rule below`，两处都带橙色边表示尚未运行；底部显示 2 处改动。点击 `Update my game` 后橙色边消失；试玩时每次被炸弹击中，画面出现 `FASTER!`，之后一切变快。
3. 把 `BOUNDARIES` 便签连接到 `PLAYERS` 便签，确认 RULES 中写明 “not in the code yet”，游戏不变。切回 `▶ Play` 时画布仍在运行。

## 试玩与迭代

1. 打开 `v1` 试玩，等待试玩反馈提示，输入 `it was too hard` 等体验描述。确认右侧 Assessment 记录孩子原话；左侧 Journal 的 `v1` 条目显示草稿便签和试玩发现。
2. 关闭首次迭代引导，在建议卡片中选择一项，完成句子或点击建议选项。确认对应区块出现新便签，并可用 `▶ Update my game` 生成新版本。
3. 打开 PR #11 之前或之后保存的旧项目：仍待确认的便签直接显示在地图上并计入待更新改动，旧连接显示为 `if → then`。

## Journal 与 Assessment

在尚未生成游戏时，左侧 Journal 应显示引导空状态，右侧 Assessment 显示待创建状态。确认便签但尚未生成时，Journal 应显示 `In progress` 设计步骤。生成版本后，Journal 按版本记录对应便签、设计分类和预测；试玩并在对话中反馈后，Assessment 和 Journal 都应显示同一条试玩反馈。刷新或重新加载旧 `v6` 项目时，已有记录仍可读取；旧版本缺少新增的 Journal/Assessment 字段时，应使用原始版本摘要和预测继续展示，不报错。

## 导出与预览

在游戏面板点击 `Export HTML`。普通浏览器应出现复制代码弹窗；将代码另存为 HTML 后打开，确认游戏可独立试玩。再运行 `npm run build`，分别检查 `dist/index.html` 可由静态服务器访问、`dist/standalone-preview.html` 可直接双击打开整站。根目录 `index.html` 是源码入口，直接双击应显示预览入口说明。

`file://` 与本地服务器的 `localStorage` 数据互不共用。验收加载时请始终使用同一访问方式；首次呈现对照请使用干净的站点数据。
