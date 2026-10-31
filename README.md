# Tinker550-Code-Game

原型重构的逐步验收基准见 [baseline/README.md](baseline/README.md)。

团队开发从 [CONTRIBUTING.md](CONTRIBUTING.md) 开始；模块关系见 [docs/architecture.md](docs/architecture.md)，完整人工验收见 [docs/acceptance.md](docs/acceptance.md)。

## 本地运行

需要 Node.js `20.19+`（20 系列）或 `22.12+`，以及 npm。在仓库根目录执行：

```bash
npm ci
npm run dev
```

终端会显示本地访问地址。生产构建和本地预览：

```bash
npm run build
npm run preview
```

`index.html` 是 Vite 源码入口，不能直接双击作为运行中的网站。若要**不启动服务器、直接双击预览**，先运行 `npm run build`，然后打开 `dist/standalone-preview.html`。构建会将页面样式与应用脚本内联成单个 HTML 文件。直接双击根目录的 `index.html` 会显示这个入口说明。

`dist/index.html` 是供静态网站服务器部署的版本；构建使用相对资源路径，适用于网站子目录。`dist/standalone-preview.html` 适合本机文件预览，也可以单独发送给团队成员。首次使用时的机器人名称与项目由浏览器 `localStorage` 决定；`file://` 与 `http://localhost` 的站点数据彼此独立。Google Fonts 需要联网才能按原型显示。

提交改动前运行统一检查：

```bash
npm run check
```

该命令检查语法、原型结构及样式一致性、设计解析、旧项目兼容、两轮迭代、生产构建、打包入口与游戏导出。GitHub Actions 使用同一命令检查推送和 PR。

## 当前结构

- `index.html`：页面外壳、静态结构与 Vite 应用入口。
- `src/app.js`：初始化项目、游戏引擎和各模块，处理项目切换与导出。
- `src/styles/base.css`：原型最初位于 `<head>` 的基础样式。
- `src/styles/app.css`：页面主样式，保留原有规则顺序与响应式断点。
- `src/game/engine.js`：原型 Canvas 游戏引擎；页面试玩与导出文件共用这一份源码。
- `src/game/export.js`：生成独立 HTML，并处理下载或复制代码的导出流程。
- `src/design/catalog.js`：八个设计维度、角色、道具和游戏模式的原始词条。
- `src/design/parse.js`：角色、动作和自由文本选项的匹配解析。
- `src/design/options.js`：根据游戏上下文生成设计选项、引导问题和句子开头。
- `src/state/project.js`：项目与界面状态的初始值、`v6` 项目恢复和游戏配置计算。
- `src/state/storage.js`：沿用 `tinkercade.projects.v6` 与 `tinkercade.bot.v6` 的本地读写。
- `src/ui/templates.js`：机器人与品牌图形、各阶段交互卡片、侧边栏、设计地图、引导浮层等原有展示模板。
- `src/ui/render.js`：根据项目和界面状态更新消息区、输入区、侧边栏、预览面板、移动端标签与弹层。
- `src/conversation/flow.js`：机器人消息队列、引导、设计确认、生成、试玩反馈与迭代流程。
- `src/events/bind.js`：页面点击、键盘和输入事件绑定。
- `tests/design-parity.test.mjs`：将词条与解析结果同原始 HTML 对照；运行 `npm run test:design`。
- `tests/state-storage.test.mjs`：验证旧项目读取、保存顺序、容量和存储失败回退；运行 `npm run test:state`。
- `tests/conversation-flow.test.mjs`：验证从首版设计到第二版生成，以及切换项目时消息队列隔离；运行 `npm run test:flow`。
- `tests/baseline-fidelity.test.mjs`：检查原始文件哈希及静态页面、样式、游戏引擎与原型一致。
- `tests/app-boot.test.mjs`：启动生产包并验证事件绑定、旧项目加载和独立游戏 HTML 导出。
- `.github/workflows/quality.yml`：在支持的 Node.js 版本上运行统一检查。
- `baseline/`：第一步保存的原始文件、截图和操作基准。

第四步将游戏引擎与导出流程拆为模块。Vite 的 `?raw` 导入在构建时把同一份引擎源码放进导出模板，使导出的游戏仍是单文件 HTML；导出模板中的 `<style>` 也继续内嵌。第五步拆出设计词库与解析。第六步拆出项目状态与本地存储，继续使用原有 `v6` 键名和 JSON 结构，不迁移或清除已保存项目。第七步拆出界面模板与 DOM 渲染。第八步拆出对话流程和事件绑定，保留原有交互文案及触发条件。

完整验收仍需在浏览器中走通三个视口、两轮迭代、保存与加载、撤销和导出；步骤见 [docs/acceptance.md](docs/acceptance.md)。
