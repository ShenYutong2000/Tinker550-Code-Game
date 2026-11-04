# 完整手工验收清单

自动检查：在仓库根目录运行 `npm ci`、`npm run check`。截图对照资料与原始操作记录见 [基准说明](../baseline/README.md)。

## 呈现

在干净的浏览器站点数据中运行 `npm run dev`，等待字体与最初两条机器人消息加载完毕。浏览器保持默认缩放，依次设置桌面 `1440×900`、平板 `1024×768`、手机 `390×844`。桌面和平板确认 Design Map 是常驻中央主工作区，Journal 与 Preview 各自能隐藏和恢复；手机确认底部 Journal、Board、Preview 导航可切换，隐藏其中一栏后仍能从 Board 恢复。检查输入框、顶部项目菜单和滚动区域没有被遮挡。Canvas 随机元素、Logo 动画和打字动画按行为核对。

## 首版游戏

1. 将机器人命名为 `Bolt`；输入角色 `a cat`、动作 `catching stars`。标题应自动变为 `Cat: Catching Stars`。
2. 在中央常驻设计地图查看首次引导。两张红色便签分别对应角色和动作；点击确认后转为黄色，`Make my game!` 可用。
3. 生成游戏并选择一项预测，点击 `I think so!`。确认右侧立即显示 `v1` 画布，Assessment 显示预测内容；点击 `Play this version` 或聊天中的试玩卡片后，画布获得焦点并响应控制键或鼠标。
4. 新建项目，在开场卡片的可选描述框输入 `A cat catches stars. When bombs fall, the stars come faster and faster. You have 3 lives. The sky is purple.`，点击 `Break it down!`。确认聊天显示原文和拆分总结，CHARACTERS、OBJECTIVES、CONFLICT、RESOURCES 方块出现红色待确认数量，CONFLICT 窗口中两条机制已用 “then” 连接，无法归类的 `The sky is purple` 在聊天中列出。再新建项目只输入 `Bombs fall from the sky.`，确认机器人只询问缺少的角色和动作，填写后其余机制一并加入。
5. 点击 `Save`，从顶部 `Projects` 菜单创建新项目，再从同一菜单加载旧项目；核对名称、对话、便签和 `v1`。改名机器人及重新开始入口也应可从项目菜单打开。关闭并重新打开同一站点，确认项目仍在。

## 第二轮迭代

1. 打开 `v1` 试玩，等待试玩反馈提示，输入 `nothing happened` 等体验描述。确认右侧 Assessment 记录预期、孩子原话和反馈分类；左侧 Journal 的 `v1` 条目显示设计便签、设计分类、预测与试玩发现。
2. 关闭首次迭代引导，在建议卡片中选择一项，完成句子或点击建议选项。确认新红色便签并再次生成。
3. 确认右侧预览更新为 `v2`，左侧 Journal 按版本保留 `v1` 与 `v2` 记录。点击 `Undo`，核对游戏预览返回 `v1`，其便签地图和试玩配置同步恢复；已有 `v1` Journal/Assessment 记录仍正确关联。

## 设计元素与机制

中央 Design Map 只显示九个元素方块（CHARACTERS 在首位），每个方块显示机制数量、连接数量和待确认数量。点击方块打开元素窗口，按 Esc、× 或点击窗口外关闭。窗口内红色便签可确认、编辑、删除。至少有两个机制时，点击 `Link two mechanisms`，再依次点击两张便签，确认出现带 “then” 的箭头和链条；再尝试自连、重复连接和成环连接，确认都被阻止。点击箭头上的 × 取消连接。确认未连接的机制显示在 “On their own” 中。在 CHARACTERS 窗口切换主角并添加角色；在其他元素窗口点击 `Add a mechanism`，确认对话进入该元素的建议步骤（首版生成前应提示先完成首版）。保存后重新载入并使用 Undo，确认连接随便签恢复；连接不改变游戏配置。

## Journal 与 Assessment

在尚未生成游戏时，左侧 Journal 应显示引导空状态，右侧 Assessment 显示待创建状态。确认便签但尚未生成时，Journal 应显示 `In progress` 设计步骤。生成版本后，Journal 按版本记录对应便签、设计分类和预测；试玩并在对话中反馈后，Assessment 和 Journal 都应显示同一条试玩反馈。刷新或重新加载旧 `v6` 项目时，已有记录仍可读取；旧版本缺少新增的 Journal/Assessment 字段时，应使用原始版本摘要和预测继续展示，不报错。

## 导出与预览

在游戏面板点击 `Export HTML`。普通浏览器应出现复制代码弹窗；将代码另存为 HTML 后打开，确认游戏可独立试玩。再运行 `npm run build`，分别检查 `dist/index.html` 可由静态服务器访问、`dist/standalone-preview.html` 可直接双击打开整站。根目录 `index.html` 是源码入口，直接双击应显示预览入口说明。

`file://` 与本地服务器的 `localStorage` 数据互不共用。验收加载时请始终使用同一访问方式；首次呈现对照请使用干净的站点数据。
