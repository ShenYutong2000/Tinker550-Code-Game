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

构建结果位于 `dist/`，可部署到静态网站；构建使用相对资源路径，适用于网站子目录。首次使用时的机器人名称与项目由浏览器 `localStorage` 决定，复核首屏请使用没有该站点数据的浏览器会话。Google Fonts 需要联网才能按原型显示。

## 当前结构

- `index.html`：页面外壳、静态结构与仍待拆分的 JavaScript。
- `src/styles/base.css`：原型最初位于 `<head>` 的基础样式。
- `src/styles/app.css`：页面主样式，保留原有规则顺序与响应式断点。
- `baseline/`：第一步保存的原始文件、截图和操作基准。

第三步只拆分了页面样式。导出小游戏所用的内嵌 `<style>` 仍在导出模板里，以保持导出的 HTML 为单文件；游戏引擎和页面脚本留待后续步骤拆分。
