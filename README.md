# Tinker550-Code-Game

原型重构的逐步验收基准见 [baseline/README.md](baseline/README.md)。

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

## 当前结构

- `index.html`：页面外壳、静态结构与仍待拆分的应用 JavaScript。
- `src/styles/base.css`：原型最初位于 `<head>` 的基础样式。
- `src/styles/app.css`：页面主样式，保留原有规则顺序与响应式断点。
- `src/game/engine.js`：原型 Canvas 游戏引擎；页面试玩与导出文件共用这一份源码。
- `src/game/export.js`：生成独立 HTML，并处理下载或复制代码的导出流程。
- `src/design/catalog.js`：八个设计维度、角色、道具和游戏模式的原始词条。
- `src/design/parse.js`：角色、动作和自由文本选项的匹配解析。
- `src/design/options.js`：根据游戏上下文生成设计选项、引导问题和句子开头。
- `src/state/project.js`：项目与界面状态的初始值、`v6` 项目恢复和游戏配置计算。
- `src/state/storage.js`：沿用 `tinkercade.projects.v6` 与 `tinkercade.bot.v6` 的本地读写。
- `tests/design-parity.test.mjs`：将词条与解析结果同原始 HTML 对照；运行 `npm run test:design`。
- `tests/state-storage.test.mjs`：验证旧项目读取、保存顺序、容量和存储失败回退；运行 `npm run test:state`。
- `baseline/`：第一步保存的原始文件、截图和操作基准。

第四步将游戏引擎与导出流程拆为模块。Vite 的 `?raw` 导入在构建时把同一份引擎源码放进导出模板，使导出的游戏仍是单文件 HTML；导出模板中的 `<style>` 也继续内嵌。第五步拆出设计词库与解析。第六步拆出项目状态与本地存储，继续使用原有 `v6` 键名和 JSON 结构，不迁移或清除已保存项目。应用其余逻辑仍在 `index.html`，后续步骤再拆分。
