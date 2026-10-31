# 代码结构与数据流

这个仓库是原始单文件原型的模块化版本。当前运行在浏览器中，使用 Vite 构建、原生 JavaScript、CSS、Canvas 与 `localStorage`；目前没有 AI 服务或后端。

```mermaid
flowchart LR
  HTML[index.html] --> App[src/app.js]
  App --> Flow[src/conversation/flow.js]
  App --> Events[src/events/bind.js]
  App --> UI[src/ui/render.js]
  UI --> Templates[src/ui/templates.js]
  Flow --> Design[src/design/]
  Flow --> State[src/state/project.js]
  App --> Storage[src/state/storage.js]
  App --> Engine[src/game/engine.js]
  App --> Export[src/game/export.js]
  Export --> Engine
```

## 模块职责

- `index.html` 保留页面静态容器和 Vite 入口；`src/styles/` 保留原始样式及响应式断点。
- `src/app.js` 创建项目状态、界面状态、Canvas 引擎和各模块，负责项目切换、撤销、保存与导出。项目对象 `P` 会在加载或新建时替换，依赖方通过 `getProject()` 读取当前对象。
- `src/conversation/flow.js` 管理消息队列、设计地图引导、便签确认、预测、生成、试玩反馈和迭代。切换项目时 `resetProject()` 清除未显示的旧消息、生成定时器和旧引导。
- `src/events/bind.js` 把现有 `data-*` 属性、键盘与输入事件连接到流程和渲染。新增按钮时，要同时检查模板属性和这里的处理分支。
- `src/ui/templates.js` 提供现有 HTML 模板与展示文案；`src/ui/render.js` 把当前项目和 UI 状态映射到 DOM。流程决定**何时**渲染，渲染模块决定**如何**呈现。
- `src/design/` 存放设计词库、文本解析和建议选项；`src/state/project.js` 生成项目状态与游戏配置；`src/state/storage.js` 集中处理浏览器存储。
- `src/game/engine.js` 是试玩引擎。`src/game/export.js` 使用 Vite 的 `?raw` 导入同一份引擎源码，生成可独立运行的游戏 HTML。

## 状态与兼容性

项目数据保存在 `tinkercade.projects.v6`，机器人名称保存在 `tinkercade.bot.v6`。项目包含 `stickers`、`chat`、`versions`、`lastBuilt`、`prediction` 等字段。`versions` 中的 `spec` 用于 Canvas，`snapshot` 用于撤销。`UI` 是当前页面的临时状态，不写入项目 JSON。

已有 `v6` 项目直接读取；`src/state/project.js` 负责为不完整的旧条目补默认值，并将无法跨会话继续的临时阶段恢复为可操作阶段。修改存储结构前，应先增加旧数据兼容测试，并在项目模块中实现迁移或兼容读取。

## 构建产物

`npm run build` 生成 `dist/index.html`，供静态网站服务器部署；同时生成 `dist/standalone-preview.html`，供本机直接双击预览。两者都由同一份源码构建。`dist/` 不提交到仓库。游戏面板的 `Export HTML` 则导出**当前项目游戏**的独立 HTML，与整站预览文件用途不同。

`baseline/source/Tinker 550.html` 是原始文件的逐字节副本。`tests/baseline-fidelity.test.mjs` 检查基准哈希、静态页面结构、样式及 Canvas 引擎是否与原型一致；有意改版时应在代码评审中说明并相应调整验收基准。
