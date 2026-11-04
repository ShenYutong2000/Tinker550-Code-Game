# 儿童 Vibe Coding 网页小游戏平台：设计地图分类与教学方案

> 后续核验对本方案作了两处收紧：①建议显示为“玩家与体验目标”，⑧建议显示为“运行与交付”；纯方法课归学习流程，而不是强塞八格。详见[新八格的理论核验](/E:/Tinker550-Code-Game/docs/children-design-map-eight-elements-validity-review.zh-CN.md)。

研究与项目方案，2026 年 11 月 2 日。本文依据当前截图及仓库中的设计地图、教学对话和游戏生成流程制定；面向可阅读简短中文句子的小学阶段学习者。更低龄儿童需要更强的语音和图卡支持，年龄范围尚应通过实际用户测试确认。这里给出**教学分类与产品改版方案**，没有直接修改现有应用。

## 1. 决策摘要

建议将截图中的“Fullerton's 8 formal elements”改为**“我的游戏设计地图：8 个创作部分”**。保留八格布局，但八格不再声称与 Fullerton 的八个形式元素逐项对应，而是成为每个后续小任务的**主要归属**：

1. **玩家与体验**：谁玩？希望玩家有什么感受？
2. **目标与结局**：玩家要做到什么？怎样赢、输或继续？
3. **角色与世界**：游戏里有什么？它们在哪里？
4. **操作与互动**：玩家怎样让游戏发生变化？
5. **规则与数据**：发生某件事时，游戏怎样计算和记住结果？
6. **挑战与节奏**：什么使目标值得努力？难度怎样变化？
7. **反馈与呈现**：玩家怎样看见、听见并理解结果？
8. **运行与可靠性**：游戏怎样在网页上稳定开始、保存、恢复和导出？

**重要设计原则**：八格回答“这次改的是游戏哪一部分”；游戏设计思维、工程师思维、AI 对话能力是贯穿每一格的**能力维度**；“想法 → 说清 → 预测 → 请 AI 帮忙 → 试玩 → 检查 → 修改”是每个任务的**学习循环**。因此每张任务卡只有一个主归属格，但可以同时标记多种能力与阶段。若是跨格的大任务，就拆成能分别验收的小任务。这样才能给“所有后续小任务都可归类”建立可执行的规则，而不是依赖模糊关键词。

这八格是针对本平台的**设计综合方案**，不是 Fullerton、MIT 或 UNESCO 已经验证过的现成八分类。正式采用前要用真实任务和儿童试玩检验分类是否清楚。

## 2. 为什么现有八格不够承担全部教学任务

现有 `COLS` 是 Fullerton 的 Players、Objectives、Procedures、Rules、Resources、Conflict、Boundaries、Outcome；截图上方的 Character 另设一栏。[当前分类词库](/E:/Tinker550-Code-Game/src/design/catalog.js)与[地图模板](/E:/Tinker550-Code-Game/src/ui/templates.js)可核对这一点。Fullerton 将八者用于解释**游戏的形式结构**，其教材又另设玩家中心过程、戏剧元素、系统动态、原型、界面和 QA 章节。因此“形式元素”本身不负责覆盖数字游戏开发中的每一项工程或学习活动。[《Game Design Workshop》目录](https://www.oreilly.com/library/view/game-design-workshop/9781482217179/) · [作者的玩家中心方法](https://www.gamedesignworkshop.com/)

当前儿童化文案还缩窄了部分概念：Procedures 被解释为键盘/鼠标控制，Boundaries 被解释为画面边缘，Outcome 被解释为结束画面。[当前分类词库](/E:/Tinker550-Code-Game/src/design/catalog.js) 若后来出现“加入背景音效”“保存进度”“修复手机触屏”“让 AI 解释错误”“让朋友试玩”这类任务，八个原格没有稳定归属，容易把过程任务硬塞进 Rules 或 Outcome。

现有首轮流程是孩子提出角色与动作、确认便签、生成游戏、预测实际结果、试玩并提出下一轮改动。这个“预测—试玩—修订”的骨架很适合继续使用。[对话流程](/E:/Tinker550-Code-Game/src/conversation/flow.js) 不过仓库当前明确写明对话、建议与生成都是本地规则实现，还未接入 AI 服务；所以现阶段可以先建立 Vibe Coding 的任务模型和可观察证据，之后再接真正的 AI 能力。[项目 README](/E:/Tinker550-Code-Game/README.md)

## 3. 八格的详细边界

### ① 玩家与体验

**儿童提问**：“谁会玩？我希望他们觉得开心、紧张、好奇，还是有成就感？”

**归入**：目标玩家、单人/双人、合作/竞争、想要的感受、试玩者观察、整体体验目标。**不归入**：获胜数值条件（②）、具体按键（④）、单次碰撞计算（⑤）。

**猫接星星例子**：“我要让第一次玩的人马上知道自己在做什么”“两个朋友一起玩，轮流挑战最高分”。**可验收证据**：孩子能说出玩家是谁，试玩者能描述出接近预期的体验。Fullerton 强调先设玩家体验目标；MDA 将玩家体验与底层机制区分，提醒我们不能从功能存在直接推定体验成立。[Fullerton](https://www.gamedesignworkshop.com/) · [MDA 原论文](https://www.cs.northwestern.edu/~hunicke/MDA.pdf)

### ② 目标与结局

**儿童提问**：“玩家正在努力完成什么？什么时候算赢、输或再试一次？”

**归入**：任务目标、胜败条件、回合结束、得分目标、重试与继续。**不归入**：障碍出现频率（⑥）、胜利特效（⑦）、保存最高分（⑧）。

**例子**：“接到 10 颗星就赢”“漏掉 3 颗星后结束并可重来”。**证据**：玩家能说清目标，系统在边界条件下显示正确结局。把原 Objectives 与 Outcome 合并，可避免孩子把“赢的条件”和“游戏结束时发生什么”当成毫无关系的两格。[Fullerton 形式元素](https://www.oreilly.com/library/view/game-design-workshop/9781482217179/)

### ③ 角色与世界

**儿童提问**：“游戏里有谁、有什么东西？它们在哪个地方活动？”

**归入**：主角、配角、道具、障碍物、场景、空间布局、位置与区域。**不归入**：碰到道具后加分的条件（⑤）、按键方式（④）、角色闪光效果（⑦）。

**例子**：“主角是一只猫，星星从天空掉落”“左边是安全区，右边有石头”。**证据**：孩子能指认关键物件及其空间关系。截图上方的 My Character 可以保留为快捷入口，但数据语义上属于本格，避免角色成为地图之外的例外。ChatScratch 的 6–12 岁研究使用结构化故事板和视觉线索支持儿童规划角色、场景与事件；其 24 人研究仅支持原型设计方向，不证明本平台一定得到同样效果。[ChatScratch 论文](https://arxiv.org/abs/2402.04975)

### ④ 操作与互动

**儿童提问**：“我按什么、点哪里？游戏会回应什么动作？”

**归入**：键盘、鼠标、触摸、移动、跳跃、发射、拖拽、操作可达性和手感。**不归入**：碰撞后扣几条命（⑤）、角色移动动画外观（⑦）。

**例子**：“左右方向键让猫移动”“点击屏幕让角色跳起”。**证据**：孩子能实际操作，输入与预期动作一致。Fullerton 的 Procedures 涵盖玩游戏时的行动流程，数字游戏还需具体检验操作方式；本格保留其核心但名称更贴近网页小游戏。[Fullerton 教材目录](https://www.oreilly.com/library/view/game-design-workshop/9781482217179/)

### ⑤ 规则与数据

**儿童提问**：“如果发生 X，游戏就做什么？它需要记住哪个数字或状态？”

**归入**：条件与结果、碰撞逻辑、计分、生命/时间/金币等变量、随机生成规则、状态变化、对象之间的因果关系。**不归入**：玩家最终要达成的目标（②）、关卡里障碍排列（⑥）、跨会话存储机制（⑧）。

**例子**：“如果猫碰到星星，就把分数加一并移走星星”“如果生命变成零，就把状态交给结局系统”。**证据**：孩子能给出输入、预期结果和反例；程序在相同条件下按规则工作。资源不再需要独立一格，因为它是状态变量及其变化规则；这一合并是产品分类选择。Brennan 与 Resnick 的计算思维框架将事件、条件、数据等视为可在互动作品中学习的计算概念。[MIT Media Lab 论文](https://www.media.mit.edu/publications/new-frameworks-for-studying-and-assessing-the-development-of-computational-thinking/)

### ⑥ 挑战与节奏

**儿童提问**：“什么拦住玩家？游戏会怎样逐渐变化？”

**归入**：敌人与障碍组合、速度与数量变化、关卡节奏、风险与奖励平衡、难度调节。**不归入**：敌人作为物件的造型或位置定义（③）、一次碰撞的计算（⑤）。

**例子**：“每得 5 分，星星掉得更快”“炸弹与星星混在一起，玩家必须判断”。**证据**：试玩者能感知挑战变化，难度与目标玩家相称。GameFlow 提供挑战、技能、控制、目标和反馈等诊断维度；它不是“越难越好”的公式。[GameFlow 原论文](https://www.valuesatplay.org/wp-content/uploads/2007/09/sweetser.pdf)

### ⑦ 反馈与呈现

**儿童提问**：“玩家怎样知道刚才发生了什么？”

**归入**：得分显示、提示文字、音效、动画、颜色和对比度、成功/受伤反馈、说明、画面可读性。**不归入**：得分计算规则（⑤）、获胜条件（②）、设备或存档故障（⑧）。

**例子**：“接到星星时弹出 +1、播放短声音”“没有声音也能看懂命中”。**证据**：试玩者能辨认行动结果，关键信息不只靠一种感官通道传达。GameFlow 与 Fullerton 都把反馈视为体验的重要部分；网页端可访问性也要求信息和控件可被不同玩家理解。[GameFlow](https://www.valuesatplay.org/wp-content/uploads/2007/09/sweetser.pdf) · [Xbox 无障碍指南](https://learn.microsoft.com/en-us/xbox/accessibility/guidelines)

### ⑧ 运行与可靠性

**儿童提问**：“游戏能不能开始、正常运行、记住进度，并让别人打开？”

**归入**：启动、加载、保存与恢复、不同网页设备、性能、错误处理、版本、导出、代码组织与通用回归检查。**不归入**：某条玩法规则是否公平（⑤/⑥）、某段动画是否清晰（⑦）。

**例子**：“刷新后还能继续玩”“导出的网页游戏在另一台电脑能打开”“手机上点按钮不会卡住”。**证据**：在目标环境按相同步骤可重复运行，故障可描述并被修复。这里是为工程师思维特设的一格；Fullerton 的形式元素目录本身没有对应项，但其书另有制作与 QA 过程，NYU 的游戏开发课程也强调把系统、交互、视觉与代码整合。[Fullerton 教材目录](https://www.oreilly.com/library/view/game-design-workshop/9781482217179/) · [NYU 开发课程](https://gamecenter.nyu.edu/courses/intro-game-development/)

## 4. 如何保证后续每个小任务都有归属

### 一项任务必须有四个字段

**主归属格**（八格选一）＋**要改变的可观察对象**＋**能力标签**（设计/工程/AI 对话，可多选）＋**验收证据**。可另存阶段、版本和孩子的预测。分类时先问“完成这项任务，游戏里**哪个部分**会改变？”而不是问“孩子用了什么工具”。

例如“让 AI 帮忙把猫碰星星加分”归⑤，AI 对话是能力标签；“让 AI 帮忙改接星星音效”归⑦；“请 AI 排查刷新后丢进度”归⑧。这样 AI 不会成为与规则、画面并列的第九个“游戏部分”，却仍能在每格得到系统训练。若任务只是“学写提示词”而没有指向游戏对象，应改写为针对某一格的练习，例如“为⑤写一条能验收的碰撞规则提示词”。

### 分类边界的三条操作规则

1. **按本次主要交付物归类**。任务“增加 10 分获胜的判定与动画”应拆成②“达到 10 分时进入获胜状态”和⑦“获胜时显示庆祝动画”。
2. **诊断与修复分开**。整体试玩、询问玩家是否理解目标可归①；一旦确认是触屏失灵，修复任务归④；若是不同手机浏览器不兼容，修复任务归⑧。
3. **规则与挑战分开**。规定“每碰到炸弹减一条命”归⑤；决定“第 2 关同时出现两颗炸弹”归⑥。前者回答事件怎样计算，后者回答挑战怎样安排。

### 代表性任务归类样本

- ①：选定单人还是双人；观察新玩家是否感到紧张但可掌控。
- ②：收集 10 颗星获胜；失败后提供重新开始。
- ③：增加猫、星星和炸弹；画出安全区与危险区。
- ④：方向键移动；加入触屏左右滑动。
- ⑤：碰星星加一分；生命减少；随机生成星星。
- ⑥：随分数增加掉落速度；设计“星星和炸弹”的取舍。
- ⑦：命中时显示 +1；受伤声音与视觉提示；文字对比度。
- ⑧：刷新后恢复进度；修复移动端卡顿；导出独立 HTML。

纯提问、写提示词、读 AI 回复、预测、测试和反思均可以围绕上述样本产生，能力标签与流程步骤负责记录“孩子怎样完成”，主归属格负责记录“孩子改了什么”。

## 5. 三种能力如何贯穿每格

### 游戏设计思维：为了玩家作出可检验的选择

每格都先问“玩家会看到/做到/感到什么”，再问“怎样知道设计真的起作用”。Fullerton 的玩家中心过程和 MIT 的课程都强调原型、试玩、修订；MDA 把设计师写下的机制与玩家实际体验分开。[Fullerton](https://www.gamedesignworkshop.com/) · [MIT《Introduction to Game Design Methods》](https://ocw.mit.edu/courses/cms-301-introduction-to-game-design-methods-spring-2016/pages/syllabus/) · [MDA](https://www.cs.northwestern.edu/~hunicke/MDA.pdf)

### 工程师思维：说清条件、拆小、预测、测试、找原因

一项任务要有可观察的成功标准；把“做一个有趣的游戏”拆成“按键能移动”“碰星星加一分”等小结果；出现差异时先记录复现步骤，再改一个原因。Brennan/Resnick 将计算思维区分为概念、实践和视角，实践包括测试调试、复用改造等；NGSS 小学工程设计标准要求明确成功标准与约束。它们支持将**过程证据**与成品并列评价。[Brennan/Resnick](https://www.media.mit.edu/publications/new-frameworks-for-studying-and-assessing-the-development-of-computational-thinking/) · [NGSS 3–5 工程设计](https://www.nextgenscience.org/pe/3-5-ets1-1-engineering-design)

### AI 对话能力：给出意图与验收，再审查输出

给孩子的短句支架建议是：“**我想让〔对象〕在〔事件/输入〕时〔具体变化〕；玩家会看到〔结果〕；请先复述你的理解，只改〔范围〕；我会用〔例子〕来检查。**”AI 回答后，孩子先预测，再试玩，标记“符合/不符合/不知道”，最后用证据追问或修正。这个循环训练的是需求表达、验证和纠错，而不是把提示词写得越长越好。UNESCO 的学生 AI 能力框架强调人类主体性和对 AI 方案的批判判断；Code.org 的 AI 课程强调测试、评价和改进输出。[UNESCO](https://www.unesco.org/en/articles/ai-competency-framework-students?hub=195885) · [Code.org《Problem Solving with AI》](https://studio.code.org/courses/problem-solving-with-ai-2025/units/1?viewAs=Instructor)

对年幼初学者，AI 可以先给“你想让哪个对象发生变化？”这类分步提示，并逐渐减少支架。ChatScratch 对 24 名 6–12 岁儿童的研究提供了结构化故事板与分步代码助手的初步证据；它研究的是 Scratch 环境，不能直接推断网页 Vibe Coding 的学习成效，因此应在本平台做小规模用户测试。[ChatScratch](https://arxiv.org/abs/2402.04975)

## 6. 教学流程：地图不是一次填完的八张问卷

建议保留当前产品已有的“先做出第一版，再猜测、试玩、修改”节奏，但将八格按**需求出现时解锁**：

1. **想象与界定**：用①②③确定谁玩、做什么、有什么对象。只需最小信息，避免过早填写全部八格。
2. **首个可玩版本**：以④⑤为核心，补最小的⑥挑战、⑦反馈和⑧运行。尽快做出能从开始玩到一个结果的短循环。
3. **预测与试玩**：孩子说出“我认为按下/碰到以后会怎样”，运行游戏，观察差异；用⑧的记录工具和对应格的内容来修复。当前项目已经有预测和试玩反馈的雏形。[现有对话流程](/E:/Tinker550-Code-Game/src/conversation/flow.js)
4. **修改与分享**：任选一格增加一个可验收的小改动，邀请同伴试玩，再回到①检查体验目标。这与 Scratch 基金会强调的“想象—创造—玩—分享—反思”螺旋一致。[Scratch 创造性学习理念](https://sfw-ui.prod.scratch.camp/learn/learning-library/scratch-creative-learning-philosophy)

地图卡片可用“未探索 / 有想法 / 已做进游戏 / 玩过并验证 / 想再改”表达进度；**空白格不等于不完整或失败**。例如简单的反应游戏可以暂时没有独立资源系统，作品仍可玩。解锁应是引导注意力，而不是强制填表。

## 7. 每个小任务的可复制模板

**孩子看见**：

> 我想改变〔地图格〕：〔对象〕在〔条件/输入〕时会〔动作或结果〕。我猜玩家会看到〔可观察结果〕。请 AI 先告诉我它理解的规则，再帮我做这一个改动。做好后，我会用〔一步操作〕检查。

**系统保存**：`primaryElement`、`childIntent`、`expectedObservation`、`aiRequest`、`aiSummary`、`actualObservation`、`testEvidence`、`revisionReason`、`version`；`skillTags` 记录设计、工程、AI 对话中的相关能力。字段是产品建议，不要求孩子直接填写技术名称。

**示例任务**：“我要在⑤规则与数据里改一件事：猫碰到星星时，分数加 1，星星消失。我猜游戏里会看到分数从 0 变 1。请先复述规则，只改碰撞与计分；我会让猫碰一次星星来检查。”试玩后若分数变 2，孩子记录复现步骤，并追问 AI “只检查为什么一次碰撞计了两次”。

**评价证据**：孩子能否说清期望、指出实际差异、解释为何修改、在新情境中复用此方法。仅看最终网页是否漂亮或 AI 是否一次生成成功，无法判断是否学到设计与工程思维。Brennan/Resnick 建议结合项目作品、基于作品的访谈和设计情境评价计算思维。[MIT Media Lab 论文](https://www.media.mit.edu/publications/new-frameworks-for-studying-and-assessing-the-development-of-computational-thinking/)

## 8. 与现有项目的迁移路径

此处是**方案，不执行代码改版**。现有应用的类别键贯穿词库、建议选项、自由文本匹配、预测缺口、对话概念说明、便签与存档；只更换八张卡片的显示文字会造成“界面叫新名字，游戏仍按旧规则理解”的不一致。[词库](/E:/Tinker550-Code-Game/src/design/catalog.js) · [选项与问题](/E:/Tinker550-Code-Game/src/design/options.js) · [对话流程](/E:/Tinker550-Code-Game/src/conversation/flow.js) · [项目状态](/E:/Tinker550-Code-Game/src/state/project.js)

建议分三步落地：

1. **内容与数据模型先行**：为八格定义稳定 ID、儿童标题、教师解释、归入/排除标准和示例；设计旧便签到新格的迁移规则。旧 `character` 并入③的语义但 UI 可继续顶栏展示。旧 `objectives`/`outcome` 并入②；旧 `resources` 并入⑤；旧 `conflict` 主要入⑥；旧 `procedures` 入④；旧 `rules` 入⑤；旧 `players` 入①；旧 `boundaries` 必须按内容区分“地图位置”入③或“碰到边界会怎样”入⑤。对含混历史便签，保留原文并提示复核，不靠关键词盲迁移。
2. **教学与生成联动**：同时更新每格的提问、选项、自由文本分类、预测缺口和游戏配置；新增⑦⑧对应的真实可见行为或明确标记为“讨论/测试任务”。对 AI 任务记录原始请求、AI 复述、孩子的预测与试玩证据，避免只保存生成后的结果。当前原型无 AI 后端，真实 AI 的接入另需设计服务端、儿童适宜的使用边界和成本控制。[项目 README](/E:/Tinker550-Code-Game/README.md)
3. **做可用性与分类验证**：从计划中的真实课程收集至少 30 张候选任务卡，让两位课程设计者独立分配主归属；讨论每一个冲突并修订边界。再让数名目标年龄儿童完成“找这张任务属于哪格”和一轮“说清—预测—试玩—修改”。“30 张、两位设计者”是建议的内部检查规模，不是研究规定。希望达到的产品标准是：没有无法归属的正式任务，绝大多数任务可由两人独立归到同一格；儿童能用自己的话解释每格并完成一轮验证。

## 9. 理论支持与适用边界

- **Fullerton**：形式元素适于分析游戏结构，玩家中心设计强调体验目标、原型和试玩；支持保留设计思想，但不支持把原八项直接当成覆盖网页开发与 AI 学习的任务目录。[教材目录](https://www.oreilly.com/library/view/game-design-workshop/9781482217179/) · [作者页面](https://www.gamedesignworkshop.com/)
- **MDA 与 GameFlow**：支持从机制、运行中的行为和玩家体验之间反复检查，并把目标、挑战、控制、反馈作为试玩观察点。它们不规定本平台八格的名称或数量。[MDA](https://www.cs.northwestern.edu/~hunicke/MDA.pdf) · [GameFlow](https://www.valuesatplay.org/wp-content/uploads/2007/09/sweetser.pdf)
- **MIT/NYU 课程**：支持快速原型、玩家测试、迭代及数字游戏的跨领域整合；因此地图不应停留在创意填写，也要连到真实可玩结果。[MIT](https://ocw.mit.edu/courses/cms-301-introduction-to-game-design-methods-spring-2016/pages/syllabus/) · [NYU](https://gamecenter.nyu.edu/courses/intro-game-development/)
- **儿童计算思维与创造性学习**：Brennan/Resnick 和 Scratch 理念支持让孩子经历设计、构建、调试、分享、反思，并以过程证据评价学习。[计算思维框架](https://www.media.mit.edu/publications/new-frameworks-for-studying-and-assessing-the-development-of-computational-thinking/) · [Scratch 理念](https://sfw-ui.prod.scratch.camp/learn/learning-library/scratch-creative-learning-philosophy)
- **工程与 AI 教育**：NGSS 支持明确成功标准与约束；UNESCO 和 Code.org 支持在 AI 辅助创作中保留学生判断、检查与修正。ChatScratch 提供儿童分步辅助的初步实证，但样本与环境有限。[NGSS](https://www.nextgenscience.org/pe/3-5-ets1-1-engineering-design) · [UNESCO](https://www.unesco.org/en/articles/ai-competency-framework-students?hub=195885) · [Code.org](https://studio.code.org/courses/problem-solving-with-ai-2025/units/1?viewAs=Instructor) · [ChatScratch](https://arxiv.org/abs/2402.04975)

**最终推荐**：把八格定义为“游戏作品的八个可改变部分”，把 AI 与工程方法设计成每张任务卡都要经历的学习循环。这样既能保证任务归类，又不会把孩子训练成只会让 AI 生成画面而不理解游戏与程序的人。
