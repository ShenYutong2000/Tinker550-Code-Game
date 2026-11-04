# Tinkercade：孩子自主设计网页小游戏的原型

这是一个帮助孩子提出游戏想法、用设计地图明确规则、生成并试玩网页小游戏的前端原型。技术栈是 Vite、原生 JavaScript、CSS、Canvas 和浏览器 `localStorage`。当前版本还没有接入 AI 或后端：引导对话和设计选项都由本地代码实现。

工作区以中央 Design Map 为主；Journal 和游戏 Preview 位于两侧，可分别收起或恢复。窄屏使用 Journal、Board、Preview 底部导航切换。

仓库从原始单文件原型整理而来。现阶段修改代码时，应保留已有页面呈现、文案、交互和 `v6` 存档兼容性。原型与截图在 [`baseline/`](baseline/README.md)；模块关系见 [架构说明](docs/architecture.md)，完整手动操作步骤见 [验收清单](docs/acceptance.md)。

## 1. 第一次运行

需要 Node.js `20.19+`（20 系列）或 `22.12+`，以及 npm。新队友先克隆仓库；已经下载仓库的队友直接进入仓库根目录：

```bash
git clone https://github.com/ShenYutong2000/Tinker550-Code-Game.git
cd Tinker550-Code-Game
```

然后运行：

```bash
npm ci
npm run dev
```

打开终端给出的本地地址。`npm ci` 按 `package-lock.json` 安装依赖；之后日常开发通常只需运行 `npm run dev`。修改完成后运行：

```bash
npm run check
```

`check` 会检查 JavaScript 语法、原型一致性、设计与存档逻辑、两轮对话流程，接着构建生产文件并检查构建后的启动与游戏导出。GitHub Actions 对推送和 Pull Request 运行同一命令。

需要检查构建结果时：

```bash
npm run build
npm run preview
```

`npm run preview` 会启动本地静态服务器。若需要**双击 HTML 文件直接预览整个网站**，先运行 `npm run build`，再打开 `dist/standalone-preview.html`。根目录 `index.html` 是 Vite 源码入口，不能作为可运行的网站直接双击；双击时只会显示预览入口说明。

## 2. 仓库目录：东西放在哪里

```text
Tinker550-Code-Game/
├─ .github/workflows/  GitHub Actions 自动检查
├─ baseline/           原始 HTML、基准截图和原型操作记录
├─ docs/               架构与人工验收文档
├─ scripts/            构建和检查时运行的 Node.js 脚本
├─ src/                网站源代码
│  ├─ conversation/    教学对话及生成、反馈、迭代流程
│  ├─ design/          设计词库、输入解析和建议选项
│  ├─ events/          点击、键盘和输入事件绑定
│  ├─ game/            Canvas 游戏引擎及游戏 HTML 导出
│  ├─ state/           项目状态、游戏配置和本地存储
│  ├─ styles/          页面样式与响应式规则
│  └─ ui/              展示模板与 DOM 渲染
├─ tests/              自动化回归测试
├─ index.html          页面的静态结构和应用入口
├─ package.json        npm 命令、依赖及 Node.js 版本要求
├─ package-lock.json   锁定依赖版本，供 npm ci 使用
├─ vite.config.js      Vite 构建配置
├─ CONTRIBUTING.md     团队分工与 Pull Request 约定
├─ .gitignore          不纳入版本控制的本地生成目录
└─ .gitattributes      原型 HTML 的 Git 文本处理设置
```

### `src/`：实际需要修改的网站代码

- `src/app.js`：启动入口。创建当前项目和界面状态，连接渲染、对话、事件、存储与游戏引擎；处理项目切换、撤销、保存及导出。跨模块接线从这里查起。
- `src/conversation/flow.js`：机器人消息队列，以及命名、创意确认、预测、生成、试玩反馈和第二轮迭代的时机与状态转换。要改“下一步发生什么”，先看这里。
- `src/design/catalog.js`：八个游戏设计维度、角色、道具及游戏模式词条。`parse.js` 识别角色、动作和自由文本；`options.js` 生成建议、问题和句子开头。要扩展孩子能表达的设计内容，先看这三个文件。
- `src/events/bind.js`：把按钮的 `data-*` 属性、键盘和输入事件连接到流程。新增交互控件时，同时检查模板和这里的处理分支。
- `src/game/engine.js`：Canvas 游戏运行代码，供网站试玩和导出的游戏共用。`export.js` 生成当前游戏的独立 HTML，并处理下载或复制代码。
- `src/state/project.js`：创建和恢复项目、初始化临时界面状态、把已确认的游戏便签转换成游戏配置。`design-map.js` 管理自由画布的规划便签、坐标、连线及与游戏便签的关联；`journal.js` 把版本便签、预测与试玩反馈整理成可显示的日志视图，并将试玩反思写回对应版本；`storage.js` 负责浏览器 `localStorage` 的读写和清除。
- `src/styles/base.css`、`app.css`：原型样式及桌面、平板、手机响应式规则。修改布局时检查三个视口。
- `src/ui/templates.js`：机器人图形、消息、卡片、项目管理弹窗、自由画布节点与工具栏、提示浮层等 HTML 模板与可见文字。`render.js` 根据当前状态把模板更新到页面。要改“显示什么”，先看这里。

数据大致按 `用户操作 → events/bind.js → conversation/flow.js 或设计画布状态 → state/ → ui/render.js` 流转；独立规划便签与游戏便签分开保存，只有对话确认的游戏便签参与 `buildProjectSpec()`；试玩时使用 `game/engine.js`。更完整的关系和 `v6` 字段说明见 [架构说明](docs/architecture.md)。

### 其他目录和根目录文件

- `.github/workflows/quality.yml`：在支持的 Node.js 版本上安装依赖并运行 `npm run check`。本地检查通过后，仍要看 PR 上的 CI 结果。
- `baseline/source/Tinker 550.html`：用户原始 HTML 的逐字节副本，作为历史基准保留。`baseline/screenshots/` 保存三个视口及设计地图、试玩、导出的截图；`baseline/README.md` 记录原始哈希和已走通的流程。日常开发不要修改原始副本。
- `docs/architecture.md`：模块职责、数据流、存档兼容和构建产物。`docs/acceptance.md`：手动验收首版游戏、第二轮迭代、保存、撤销和导出的步骤。
- `scripts/check-syntax.mjs`：检查源码、脚本和测试的 JavaScript 语法。`scripts/make-file-preview.mjs`：把构建后的 JS 和 CSS 内联，生成可直接双击的整站预览文件。
- `tests/baseline-fidelity.test.mjs`：核对原始文件哈希、静态页面、样式和游戏引擎。`design-parity.test.mjs`：核对设计词条与解析。`design-map.test.mjs`：检查自由便签、移动边界、连线和游戏便签同步。`state-storage.test.mjs`：检查旧 `v6` 项目、地图便签保存、存储行为和 Journal/Assessment 数据。`conversation-flow.test.mjs`：检查两轮创作、试玩记录与项目切换。`app-boot.test.mjs`：检查生产包启动、旧项目加载及游戏 HTML 导出。
- `index.html`：页面固定容器、按钮及 Vite 模块入口。`vite.config.js` 使用相对资源路径，便于把构建结果放在网站子目录。
- `package.json` 定义开发、构建和检查命令；修改依赖时一并更新并提交 `package-lock.json`。`CONTRIBUTING.md` 说明三人协作边界和 PR 要求。
- `dist/` 和 `node_modules/` 是本地生成目录，已被 `.gitignore` 排除。前者由构建产生，后者由 `npm ci` 安装；不要把它们提交到 GitHub。

## 3. 两种 HTML 导出不要混淆

`npm run build` 会生成 `dist/index.html`（部署到静态服务器）和 `dist/standalone-preview.html`（本机双击预览**整个网站**）。游戏面板里的 **Export HTML** 导出的是**当前项目的小游戏**，不是整个网站。

网站仍在浏览器内用 `localStorage` 保存项目，键名是 `tinkercade.projects.v6` 和 `tinkercade.bot.v6`。`file://` 预览与本地开发服务器的数据位置不同；测试“保存后重新加载”时请始终使用同一种打开方式。Google Fonts 需要联网才能显示与基准一致的字体。

## 4. 队友如何继续开发

建议每次只做一个可验收的小改动，例如“新增一个设计选项并补解析测试”或“改进手机上的某个交互”。三人可按以下方向认领工作：

- **页面与交互呈现**：`src/ui/`、`src/styles/`、`index.html`，关注三个视口和模板的 `data-*` 属性。
- **教学对话与设计逻辑**：`src/conversation/`、`src/design/`，关注引导时机、文案与两轮创作。
- **游戏与项目数据**：`src/game/`、`src/state/`，关注试玩、独立 HTML 导出和旧 `v6` 存档。

一个改动涉及多个方向时，改动者负责把相关模块、测试和文档一起更新，并请受影响方向的队友复核。`src/app.js` 是模块接线处，改跨模块接口前先说明新增的参数或回调。详细约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。

推荐协作顺序：

1. 确认团队当前使用的集成分支已经包含最新整理，再从它创建自己的功能分支（例如 `feature/design-options`）；在任务或 PR 描述中写清目标、不得改变的现有行为，以及完成后的可见结果。
2. 先读对应模块及测试，再让 AI 只修改这次任务涉及的文件。要求 AI 列出修改原因、实际运行的检查和未验证的部分。
3. 自己运行 `git status`、`git diff` 和 `git diff --check`，重点核对文案、DOM 顺序、`data-*`、CSS 断点、`v6` 存档格式和独立游戏导出。不要直接接受未经审查的大范围重写。
4. 运行 `npm run check`，再按 [人工验收清单](docs/acceptance.md) 在受影响视口走通流程。随机 Canvas 动画和打字动画按行为核对，无需逐帧相同。
5. 自己决定暂存和提交哪些文件，发起 PR，请至少一位队友审查；确认 CI 通过后再合并。不要提交 `dist/`、`node_modules/`、本地存档或密钥。

### 可以直接给 AI 编码助手的任务模板

```text
请先阅读 README.md、CONTRIBUTING.md、docs/architecture.md 和本次涉及的源码及测试。
任务：[写一个具体的小目标]
验收：[写可观察的页面结果或输入输出]
约束：保留当前原型的其他文案、布局、交互、v6 存档兼容性及导出的独立 HTML。
请只修改相关模块，补充能验证实际行为风险的测试；运行 npm run check，并说明结果和仍需人工验收的项目。
完成后给我查看 git diff；不要替我执行 git add、git commit 或 git push。
```

例如，要增加一种设计建议，先让 AI 检查 `src/design/catalog.js`、`options.js`、`parse.js`、相关模板和 `tests/design-parity.test.mjs`，说明现有选项如何到达游戏配置，再修改最少的文件。若有意改变原型呈现或规则，应在 PR 里明确写出产品决定和新的验收结果；历史原始 HTML 仍保留。

未来接入真正的 AI 服务时，请先设计服务端接口及数据边界，再修改对话流程；不要把 API 密钥放进 `src/`、`index.html` 或前端构建产物。
