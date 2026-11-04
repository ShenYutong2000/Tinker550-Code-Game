# 网页游戏开发的基本元素与先后顺序：以 2048 为例

研究整理：2026 年 11 月 2 日。本篇是《专业游戏设计与开发》报告的网页单机游戏补篇，只讨论游戏本体的设计、实现和验证。以**经典规则的 4×4 单机 2048**为具体对象；若要开发带排行榜、账号、多人对战或广告的变体，应另行加入相应系统与验证工作。

## 结论先行

原报告的玩家体验、规则、目标与挑战、反馈与操作、技术、质量等原则仍适用，但重要性和开发先后需要调整。2048 的内容几乎完全由简单规则与随机生成的局面产生，因此“关卡量产、世界观、叙事、人物、美术资产管线”不再是主路径；“可精确验证的规则实现、浏览器输入/呈现、状态恢复、可访问性与设备适配”成为主路径。

建议顺序是：**写清规则与体验目标 → 实现并验证纯棋盘逻辑 → 做可玩的灰盒网页 → 外部试玩 → 完成游戏状态与反馈 → 键盘/触屏和响应式体验 → 存档与可访问性 → 跨浏览器回归与打磨**。这是一条有反馈回路的顺序，而非禁止并行的瀑布流程。MIT 的游戏设计课程重视快速原型、试玩与迭代；NYU 的数字游戏开发课程用简单游戏原型练习从系统到交互与视觉的整合。[MIT 课程大纲](https://ocw.mit.edu/courses/cms-301-introduction-to-game-design-methods-spring-2016/pages/syllabus/) · [NYU《Introduction to Game Development》](https://gamecenter.nyu.edu/courses/intro-game-development/)

## 一、相对原报告，基本元素怎样调整

### 保持核心地位：体验目标与系统规则

2048 的一句话体验可以写成：“玩家用四个方向操控整盘数字方块，在有限空间与随机新方块的压力下规划合并，逐步接近 2048。”这里的体验目标是**可理解的策略选择、可预见的后果、越来越紧张的空间管理，以及合并大数的明确奖励**。这属于设计目标，不能仅靠游戏名称或得分系统自动实现。

MDA 框架提供了检查方法：**机制**是四方向移动、同值合并、随机生成、得分和终局；**动态**是玩家保留空位、组织同值方块、控制大数位置、在风险中选择方向；**体验**可能是掌控感、紧张感、失误后的可解释性与合成大数字的满足。这里对动态和体验的描述是根据 MDA 对 2048 的分析推论，需通过试玩观察验证。[MDA 原论文](https://www.cs.northwestern.edu/~hunicke/MDA.pdf)

### 提前：规则精度与状态模型

对于 2048，几乎所有可玩性都依赖少量规则的准确性。原版使用 4×4 棋盘、两个起始方块；新方块在空位生成，数值 2 的概率为 90%，4 的概率为 10%；只有棋盘真正改变的移动才生成新方块；单次移动中，合并后的方块不能再次合并；合并值计入分数；达到 2048 后可选择继续；没有空位也没有相邻可合并方块时结束。这些细节应在画面打磨之前写为可执行的规则规格。[原版 `game_manager.js`](https://github.com/gabrielecirulli/2048/blob/master/js/game_manager.js) · [Neller：2048 教学研究](https://cs.gettysburg.edu/~tneller/papers/ccsce14-2048.pdf)

状态至少包括棋盘、分数、是否已胜利、是否已失败、是否选择继续；最佳分数和持久化快照可以在核心玩法稳定后加入。推荐把“接收方向 → 计算棋盘与分数变化 → 判断是否有效 → 如有效则生成新方块 → 检查胜负 → 展示结果”视为一个明确的状态转移，而不是把规则散落在动画与 DOM 事件中。分离纯规则与显示层是本文的工程建议，目的在于让规则可独立检验、输入方式可替换。原版代码也将输入管理、游戏管理、画面呈现和存储分为不同职责。[原版项目](https://github.com/gabrielecirulli/2048) · [原版规则代码](https://github.com/gabrielecirulli/2048/blob/master/js/game_manager.js)

### 保持重要，但改变形式：目标、挑战与内容节奏

2048 没有传统关卡表；挑战来自棋盘空间持续变少、合并机会变化和随机新方块。内容设计因此更多体现为**初始局面、生成分布、胜利目标、继续游玩、是否加入撤销/提示/不同棋盘大小等变体**。如果目标是忠实实现经典 2048，先固定原规则再考虑变体；若目标是原创变体，应一次只改一个关键参数或规则，并用可玩测试比较。GameFlow 中的清晰目标、适当挑战、控制和反馈尤其适合诊断此类谜题，但这套框架最初在有限类型上验证，不能当作绝对评分公式。[GameFlow 原论文](https://www.valuesatplay.org/wp-content/uploads/2007/09/sweetser.pdf) · [Neller 论文](https://cs.gettysburg.edu/~tneller/papers/ccsce14-2048.pdf)

### 提前：操作与反馈

2048 每次输入都会改变整个棋盘，玩家必须清楚看见方块**从哪里移动、哪些方块合并、哪里生成新方块、分数为何增长**。灰盒阶段先保证结果正确、数字可读；之后加入短而一致的位移、合并和出现动画。动画是结果的解释，不应成为规则运算的依据。原版分别处理键盘方向键与触屏滑动，说明网页游戏需要考虑不同输入设备。[原版输入代码](https://github.com/gabrielecirulli/2048/blob/master/js/keyboard_input_manager.js) · [GameFlow 原论文](https://www.valuesatplay.org/wp-content/uploads/2007/09/sweetser.pdf)

### 收缩：叙事、世界观、大量资产与音频

这些在经典 2048 中不是核心依赖。可以保留简洁的视觉语言、数字层级、得分反馈和可选音效，但先后顺序应落在规则与可读性之后。增加故事、角色、皮肤或大量音频只是变体方向，必须证明它们改善了目标体验。NYU 的课程强调把系统、交互、视觉、声音与代码整合，但并未要求每个小作品投入相同规模的所有领域。[NYU《Introduction to Game Development》](https://gamecenter.nyu.edu/courses/intro-game-development/)

### 前置并贯穿：网页平台适配与质量

网页 2048 是回合制、由输入驱动的游戏；规则状态无需每帧更新。MDN 指出，网页游戏可在玩家输入后更新，动画再使用浏览器绘制机制或 CSS。由此推论，对 2048 无需先开发持续运行的游戏引擎循环，先做事件驱动的状态转移更简单。网页端还要考虑视口大小、触屏手势与页面滚动冲突、键盘焦点、刷新后状态恢复、存储不可用时的行为、不同浏览器及设备的显示。[MDN《Anatomy of a video game》](https://developer.mozilla.org/en-US/docs/Games/Anatomy) · [MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

可访问性在这里不是末尾的装饰：操作按钮要能由键盘使用且有可见焦点；游戏操作与页面其他元素的方向键行为要清楚；数字和状态不能只靠颜色区分；动画应尊重减少动态效果的系统偏好。网页标准资料可直接指导这些设计选择。[MDN 键盘可访问性](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Keyboard) · [MDN 减少动态效果](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)

### 暂不进入主路径：生产与商业发行

原报告中的预算、团队排期、商店页、营销和运营对商业项目有意义，但若任务限定为“开发一个网页端 2048 游戏本体”，它们不是实现顺序的基本元素。此处只保留必要的构建可重复性、代码管理与跨环境检查。这是范围取舍，不表示发布时永远不需要这些工作。

## 二、2048 的推荐开发顺序与阶段门槛

### 阶段 1：规则规格与体验假设

**先写**：棋盘尺寸、初始方块数量、生成概率、四方向滑动、一次合并限制、计分、无效移动、胜利/失败/继续、重新开始。最好同时写 5–10 个“输入棋盘 → 期望棋盘”的例子，并决定是否追求原版一致性。

**为什么先做**：规则有一处含混，就会污染后续动画、得分、试玩和存档。MIT 的纸面原型作业强调快速尝试规则并观察意外的游戏动态。[MIT 纸面原型作业](https://ocw.mit.edu/courses/cms-611j-creating-video-games-fall-2014/348ee58d265e61e4760d196bd97b1ad1_MITCMS_611JF14_Paper_Prot.pdf)

**完成标准**：开发者能在纸上解释任意一行 `[2, 2, 2, 2]` 向左移动为何变为 `[4, 4, 0, 0]`，且同一回合不会变成 `[8, 0, 0, 0]`；团队对变体与原版规则的差异有明确记录。[原版规则代码](https://github.com/gabrielecirulli/2048/blob/master/js/game_manager.js)

### 阶段 2：纯棋盘逻辑与关键规则检验

**先实现**：棋盘数据结构、单行压缩/合并、四方向变换、分数增量、是否发生变化、空位检测、可用移动检测、胜利/失败判断。随机生成器应可替换或注入固定结果，以便复现边界情况；真实随机只在有效移动后调用。

**关键检验例子**：

- `[2,2,2,2]` 向左 → `[4,4,0,0]`，本步得 8 分。
- `[2,2,4,0]` 向左 → `[4,4,0,0]`，本步得 4 分。
- `[4,4,4,0]` 向左 → `[8,4,0,0]`；第一个 8 不会在同一步再次合并。
- 向已经贴边且无法合并的一侧操作，棋盘、分数均不变，且**不生成**新方块。
- 棋盘全满但有相邻同值方块时仍可继续；满盘且没有任何相邻同值时才失败。

这些检验是因为 2048 的核心风险恰好是可精确判定的状态规则，属于有价值的验证，而非给每个低影响 UI 细节重复写测试。Gettysburg College 的 2048 论文将数组表示、完整游戏状态建模和搜索实验列为递进练习，说明此类小游戏的关键技术工作首先在棋盘模型。[Neller 论文](https://cs.gettysburg.edu/~tneller/papers/ccsce14-2048.pdf)

**完成标准**：上述边界例子稳定通过；相同初始棋盘和相同随机序列会得到相同结果；规则代码不依赖 DOM、动画或具体键盘事件。

### 阶段 3：最小可玩网页原型

**实现**：最朴素的 4×4 方格、数字、四方向键盘输入、当前分数、具有正常键盘语义和可见焦点的重开按钮。输入只调用已验证的规则函数，再把新的棋盘状态显示出来。开始阶段允许没有动画、音效和精美配色；阶段 6 再完成全面的设备与可访问性检查。

**为什么此时做**：纯逻辑虽可证明规则正确，却不能证明玩家能理解并享受操作。MIT 和 NYU 的课程都把“可玩原型 → 测试 → 迭代”作为训练核心。[MIT 课程](https://ocw.mit.edu/courses/cms-301-introduction-to-game-design-methods-spring-2016/pages/syllabus/) · [NYU 原型课程](https://gamecenter.nyu.edu/courses/prototype-studio/)

**完成标准**：从打开页面到失败/胜利可完整玩一局；无须开发者解释规则；刷新前每一步结果与规则规格一致。

### 阶段 4：首次外部试玩与设计修正

**观察**：请没有参与开发、但会玩轻度网页谜题的人操作。不要先教学；记录他们能否发现方向控制、理解“相同数字合并”、看出无效移动、解释失败原因、愿不愿再来一局。访谈可问“你刚才以为会发生什么？”和“哪一步让你困惑？”，避免只问“好玩吗”。

**可能的修正**：如果大量人误解合并，优先改说明、动画或反馈；如果胜负太突然，改状态提示；如果规则本身带来不想要的体验，回到阶段 1，而不是靠配色掩盖。MIT 的课程要求实际试玩并根据反馈修订设计。[MIT 课程](https://ocw.mit.edu/courses/cms-301-introduction-to-game-design-methods-spring-2016/pages/syllabus/)

**完成标准**：试玩者能独立完成数次有效移动、说清自己为什么得分/失败；团队有按影响排序的问题清单。

### 阶段 5：完善游戏状态与视觉反馈

**实现**：新方块、移动与合并的短动画；清晰的得分变化；胜利、失败、继续、重新开始的状态和按钮。把“规则结果”和“动画过渡”分开，避免动画尚未结束时连击造成错位。反馈的优先级是可理解性和响应速度，其次才是装饰程度。

**完成标准**：玩家能在动作后辨认合并和新生成方块；快速连续输入不会产生重复合并、丢步或状态错乱；关闭动画仍能正常玩。[原版规则代码](https://github.com/gabrielecirulli/2048/blob/master/js/game_manager.js) · [GameFlow](https://www.valuesatplay.org/wp-content/uploads/2007/09/sweetser.pdf)

### 阶段 6：网页输入、布局与可访问性

**实现**：桌面键盘、手机触屏滑动、不同宽度的棋盘布局；控制页面滚动与游戏手势的冲突；重开/继续等按钮具有键盘焦点与操作语义；保留数字文本和足够的可读性；在系统请求减少动画时缩短或去除非必要动态效果。输入事件只转换为“向上/右/下/左”，不复制四套规则实现。

**完成标准**：桌面与手机都能完整玩一局；键盘焦点不丢失，页面其他控件仍可正常操作；缩放后数字不溢出；减少动态效果偏好得到尊重。[原版输入代码](https://github.com/gabrielecirulli/2048/blob/master/js/keyboard_input_manager.js) · [MDN 键盘指南](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Keyboard) · [MDN 动画偏好](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)

### 阶段 7：存档与恢复

**实现**：保存棋盘、分数、胜负状态、继续游玩状态及最佳分数；刷新后恢复；重开后清理当前局，但最佳分数可保留。对损坏或旧版本数据做安全回退，对存储不可用保持游戏可玩。原版项目也将游戏状态与最佳分数存入浏览器本地存储，并检测存储支持情况。[原版存储代码](https://github.com/gabrielecirulli/2048/blob/master/js/local_storage_manager.js)

**完成标准**：有效进行中的局面刷新后恢复；结束后刷新不会复活错误状态；禁用或限制本地存储时仍可开始新游戏。MDN 指出 `localStorage` 跨普通浏览会话保存，但私密模式的行为不同，且 API 是同步的；对 2048 这种小状态量通常足够，存储失败仍需处理。[MDN Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

### 阶段 8：跨环境回归与最终打磨

**检查**：至少覆盖计划支持的桌面和移动浏览器、窄屏与放大显示、键盘与触摸、连续快速操作、刷新与恢复、胜利/继续/失败/重开。基于已记录的问题修复，并再次邀请玩家独立试玩。若没有时间做全部组合，优先覆盖最常用设备及最可能破坏核心路径的情形。

**完成标准**：核心路径在目标环境稳定，规则边界无回归，玩家对目标与结果的理解符合最初体验承诺。网页平台技术验证与玩家体验验证应同时存在；其一不能替代另一。[MDN 网页游戏结构](https://developer.mozilla.org/en-US/docs/Games/Anatomy) · [MIT 课程](https://ocw.mit.edu/courses/cms-301-introduction-to-game-design-methods-spring-2016/pages/syllabus/)

## 三、为什么不能简单照搬一般游戏的“垂直切片 → 内容量产”

大型内容型游戏用垂直切片检验一段成品质量、团队协作及内容生产速度。经典 2048 的主要内容由规则自动产生，几乎没有大量关卡要复制。因此这里仍需要一个**完整、接近成品的一局体验**作为质量门槛，但它主要验证规则、输入、反馈、状态恢复与跨设备可靠性，而不是关卡或美术资产的量产速度。这个调整是根据 Volition 对垂直切片的用途和 2048 作品结构做出的推论。[GDC：The Vertical Slice Challenge](https://gdcvault.com/play/1022329/The-Vertical-Slice) · [原版 2048 源码](https://github.com/gabrielecirulli/2048)

如果项目改成“有 100 个手工关卡的 2048 变体”，内容管线和关卡节奏就重新变成核心；如果改成“多人竞速 2048”，网络、同步、公平性和服务器稳定性必须前置。开发顺序总是由**最可能推翻游戏体验或实现可行性的风险**决定。

## 四、最简实施蓝图

建议把代码职责分为四层，按依赖方向开发：

1. **规则层**：纯函数处理棋盘、合并、得分、胜负和可选的随机源；输出状态变化及供动画使用的事件。
2. **输入层**：把键盘、触屏和按钮统一映射为游戏命令；负责焦点与浏览器默认行为。
3. **表现层**：根据状态显示棋盘、分数与消息；动画只呈现已经确定的规则结果。
4. **持久层**：保存/恢复小规模游戏状态；失败时平稳回退，不影响开始新局。

这里的分层是面向 2048 的工程建议，参考了原版项目的职责划分和 MDN 对事件驱动网页游戏的描述，并非学术论文直接规定的架构。[2048 原版项目](https://github.com/gabrielecirulli/2048) · [MDN 网页游戏结构](https://developer.mozilla.org/en-US/docs/Games/Anatomy)

**一句话开发原则：先确保每一次方向输入都会产生正确且可解释的棋盘变化，再让这个变化在不同网页设备上清楚、可靠地被玩家体验到。**

## 主要参考资料

- [Hunicke、LeBlanc、Zubek：MDA 游戏设计框架](https://www.cs.northwestern.edu/~hunicke/MDA.pdf)。用于区分规则、运行中的行为与玩家体验。
- [Sweetser、Wyeth：GameFlow](https://www.valuesatplay.org/wp-content/uploads/2007/09/sweetser.pdf)。用于评估目标、挑战、控制与反馈等体验维度。
- [MIT《Introduction to Game Design Methods》](https://ocw.mit.edu/courses/cms-301-introduction-to-game-design-methods-spring-2016/pages/syllabus/)。用于确定原型、试玩与迭代的方法。
- [NYU《Introduction to Game Development》](https://gamecenter.nyu.edu/courses/intro-game-development/)。用于数字游戏各领域的整合实践。
- [Gabriele Cirulli 的 2048 原版代码](https://github.com/gabrielecirulli/2048)。用于核对经典规则、输入、呈现与存储职责。
- [Todd W. Neller：2048 的教学与状态建模研究](https://cs.gettysburg.edu/~tneller/papers/ccsce14-2048.pdf)。用于核对规则与理解棋盘模型的教学价值。
- [MDN《Anatomy of a video game》](https://developer.mozilla.org/en-US/docs/Games/Anatomy)、[Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)、[键盘可访问性](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Keyboard)。用于网页实现约束。

本文中“规则优先的具体开发顺序”“四层职责划分”和“适用于 2048 的完整一局质量门槛”是基于来源的综合推论，建议随目标功能和玩家测试结果调整。
