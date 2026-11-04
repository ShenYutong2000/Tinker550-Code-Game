# 儿童网页小游戏设计地图：新八格的理论核验

2026 年 11 月 2 日。本文复核[前一版八格方案](/E:/Tinker550-Code-Game/docs/children-vibe-coding-design-map-proposal.zh-CN.md)的理论依据与分类边界。“核验”是文献和课程对照、任务压力测试；**还不是**儿童用户实验。

## 结论

八格作为“孩子创作网页小游戏时，任务改变了游戏的哪个部分”的地图，**有合理的跨学科依据，值得进入原型验证**。它不是 Fullerton、MDA 或任何课程原封不动提出的八项标准。②至⑦的边界相对稳固；①“玩家与体验”、⑧“运行与可靠性”有价值，但分别属于设计意图和数字作品工程层，较容易吞并其他格。建议改名为**①玩家与体验目标**、**⑧运行与交付**，并明确：测试与调试贯穿八格；故障按受影响的游戏部分归类，跨功能的启动、存储、兼容、性能与导出问题才归⑧。

“每个后续小任务都能归类”的条件也要收紧为：**每张有关游戏作品的任务卡有且只有一个主要归属；跨格任务拆开。**纯粹的“如何向 AI 提问”“如何邀请同伴试玩”是学习方法，放在贯穿八格的流程或能力标签中；练习时再附着于一个具体游戏任务。这比承诺所有教学活动都属于某格更严谨。

## 文献能支持到哪一步

Fullerton 第五版把 Players、Objectives、Procedures、Rules、Resources、Conflict、Boundaries、Outcome 作为形式元素，同时另列 Character/Story、Challenge、Feedback、System Dynamics、Digital Prototyping 和 Playtesting。这支持保留其分析游戏的核心，却说明原八项并非数字游戏制作任务的完整分类。[《Game Design Workshop》第五版目录](https://www.oreilly.com/library/view/game-design-workshop/9781003858447/xhtml/A_002_toc.xhtml)

MDA 将机制、实际运行的动态、玩家体验区分，支持把⑤规则、⑥挑战动态、①体验目标分别讨论。GameFlow 把清晰目标、控制、挑战、反馈列为玩家体验的评价维度，为②④⑥⑦提供独立观察点。这两项研究都没有规定必须采用我们的八格名称或数量。[MDA 原论文](https://aaai.org/papers/ws04-04-001-mda-a-formal-approach-to-game-design-and-game-research/) · [GameFlow 原论文](https://doi.org/10.1145/1077246.1077253)

NYU《Introduction to Game Development》要求把视觉、声音、系统、交互与代码整合成简单数字原型；MIT《Introduction to Game Design Methods》强调快速原型、玩家测试和迭代。因此⑦呈现、⑧可运行作品在网页游戏课程中有理由占位，教学顺序也应循环而非一次填完八格。ISO/IEC 25010:2023 的软件质量模型支持检查运行质量，但并没有把它定义为传统游戏形式元素。[NYU 课程](https://gamecenter.nyu.edu/courses/intro-game-development/) · [MIT 课程](https://ocw.mit.edu/courses/cms-301-introduction-to-game-design-methods-spring-2016/pages/syllabus/) · [ISO 官方简介](https://www.iso.org/standard/78176.html)

Brennan/Resnick 的儿童计算思维框架区分计算概念、实践与视角；Scratch 的创作螺旋是想象、创作、玩、分享、反思；UNESCO 的学生 AI 框架强调对 AI 方案的批判判断。它们支持把设计思维、工程思维和 AI 对话设为**贯穿每格的能力与实践**。ChatScratch 在 24 名 6–12 岁儿童的 Scratch 研究中使用结构化故事板和分步 AI 辅助，提供初步设计线索，却不能证明网页 Vibe Coding 平台会产生同样学习效果。[Brennan/Resnick](https://www.media.mit.edu/publications/new-frameworks-for-studying-and-assessing-the-development-of-computational-thinking/) · [Scratch 基金会](https://www.scratchfoundation.org/learn/learning-library/scratch-creative-learning-philosophy) · [UNESCO](https://www.unesco.org/en/articles/ai-competency-framework-students?hub=343) · [ChatScratch](https://doi.org/10.1145/3613904.3642229)

## 逐格核验与必要边界

1. **玩家与体验目标：理论强，分类边界需收紧。** Fullerton 的玩家中心设计及 MDA 的体验层支持先问“给谁玩、希望感受什么”。只收受众、体验意图、整体试玩观察。“为了更紧张而加速敌人”实际改的是⑥，不能因为意图是体验就归①。[Fullerton](https://www.oreilly.com/library/view/game-design-workshop/9781003858447/xhtml/A_002_toc.xhtml) · [MDA](https://aaai.org/papers/ws04-04-001-mda-a-formal-approach-to-game-design-and-game-research/)
2. **目标与结局：理论强，合并合理。** 合并 Fullerton 的 Objectives 与 Outcome；GameFlow 支持清晰目标。“达到 2048 获胜”归②；分数怎样计算归⑤；胜利烟花归⑦。[Fullerton](https://www.oreilly.com/library/view/game-design-workshop/9781003858447/xhtml/A_002_toc.xhtml) · [GameFlow](https://doi.org/10.1145/1077246.1077253)
3. **角色与世界：理论强，须兼容抽象游戏。** Fullerton 把角色、故事、世界单列。2048 不需要主角，但棋盘和数字方块仍是对象与空间；儿童文案宜写“角色、物件与场景”，不强迫编故事。[Fullerton](https://www.oreilly.com/library/view/game-design-workshop/9781003858447/xhtml/A_002_toc.xhtml)
4. **操作与互动：理论强。** Fullerton 的 Procedures、GameFlow 的控制感和 NYU 的交互设计支持独立处理输入。“滑动触发左移”归④；左移后如何合并归⑤。[Fullerton](https://www.oreilly.com/library/view/game-design-workshop/9781003858447/xhtml/A_002_toc.xhtml) · [GameFlow](https://doi.org/10.1145/1077246.1077253) · [NYU](https://gamecenter.nyu.edu/courses/intro-game-development/)
5. **规则与数据：理论强。** Fullerton 的 Rules、Resources 和对象属性、MDA 的机制与计算思维中的事件、条件、数据，支持合并状态与因果规则。“生成 2 或 4”的机制归⑤；为了平衡难度而调整出现比例归⑥。[Fullerton](https://www.oreilly.com/library/view/game-design-workshop/9781003858447/xhtml/A_002_toc.xhtml) · [MDA](https://aaai.org/papers/ws04-04-001-mda-a-formal-approach-to-game-design-and-game-research/) · [Brennan/Resnick](https://www.media.mit.edu/publications/new-frameworks-for-studying-and-assessing-the-development-of-computational-thinking/)
6. **挑战与节奏：理论强，易与⑤重叠。** Fullerton 的 Conflict、Challenge 和系统调校，加上 GameFlow 的挑战维度，支持障碍组合、难度曲线、风险回报、关卡节奏。固定的“碰炸弹扣一命”仍归⑤；“每五分增加炸弹频率”归⑥。[Fullerton](https://www.oreilly.com/library/view/game-design-workshop/9781003858447/xhtml/A_002_toc.xhtml) · [GameFlow](https://doi.org/10.1145/1077246.1077253)
7. **反馈与呈现：理论强，适合数字媒介。** GameFlow 的反馈、Fullerton 的数字界面原型和 NYU 的视觉声音整合，支持分数显示、提示、声音、动画和易读性。“算出 +4”归⑤，“显示 +4”归⑦；物件身份与空间是③，物件的视觉表达是⑦。[GameFlow](https://doi.org/10.1145/1077246.1077253) · [Fullerton](https://www.oreilly.com/library/view/game-design-workshop/9781003858447/xhtml/A_002_toc.xhtml) · [NYU](https://gamecenter.nyu.edu/courses/intro-game-development/)
8. **运行与交付：工程依据强，游戏形式元素依据弱。** NYU 的数字原型与 ISO 软件质量支持浏览器启动、存档、跨设备、性能和导出。此格刻意补入网页作品层。所有格都应被测试；某项规则出错归⑤，胜利提示不可见归⑦，浏览器刷新丢失进度才归⑧。[NYU](https://gamecenter.nyu.edu/courses/intro-game-development/) · [ISO](https://www.iso.org/standard/78176.html)

## 2048 覆盖测试及反例

2048 可以各取一项真实任务：①让新玩家一分钟内理解玩法；②首次合成 2048 触发胜利；③创建 4×4 棋盘与数字方块；④支持键盘和触屏滑动；⑤规定移动、合并、计分与新块生成；⑥调节新块概率与棋盘压力；⑦加入移动动画、合并高亮与分数提示；⑧刷新恢复棋盘并能在手机浏览器运行。这表明八格对一个典型小游戏有**内容覆盖**，不证明儿童一定能无歧义地分类。

边界反例：“支持色弱玩家”涉及⑦颜色提示与④操作可达性，应拆任务；“保存最高分”涉及⑤最高分计算和⑧跨会话存储，应拆任务；“邀请朋友试玩”是方法，若观察整体困惑可挂①，若验证合并规则可挂⑤；“学会向 AI 报告错误”若没有具体游戏改动，应在学习流程中教授，不强塞进任一格。

## 完成实证验证的步骤

1. **覆盖性**：从抽象益智、动作反应、创意叙事等不同类型收集真实任务，包含存档、设备适配、无障碍、调试和 AI 对话。先区分“游戏作品改动”和“独立学习活动”，再检查是否有作品任务无法归类。
2. **区分度**：至少两名未参与命名的课程设计者独立分类，记录首选、次选和原因；看一致率及混淆最多的格对。通过阈值由团队预先设定为内部产品标准，不冒充研究规定。
3. **儿童理解度**：让目标年龄儿童做有主持人的卡片分类与找任务测试，记录他们如何理解标签，再在真实界面复测。卡片分类发现儿童的分组方式；树测试检验已命名分类是否好找。[NN/g 方法说明](https://www.nngroup.com/articles/tree-testing/)
4. **学习效果**：在新游戏任务中检查孩子能否独立说清预期、预测、比较 AI 输出与实际、复现问题并修改。作品完成度或 AI 一次生成成功，不能单独证明学到了设计和工程思维。[Brennan/Resnick](https://www.media.mit.edu/publications/new-frameworks-for-studying-and-assessing-the-development-of-computational-thinking/) · [NGSS 小学工程设计](https://www.nextgenscience.org/topic-arrangement/3-5engineering-design)

**采用建议：有条件采用。**保留八格，改①⑧名称并实施上述边界；用“作品的主要改动”定主格，用能力标签与学习循环记录方法。完成任务归类和儿童测试前，应称它为**有理论依据的产品假设**，不称为“研究已验证的八大游戏开发要素”。
