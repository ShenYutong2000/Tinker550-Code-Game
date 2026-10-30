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

当前第二步只建立 Vite 入口。`index.html` 与基准原始文件逐字节一致，页面代码仍为单文件；后续步骤才按职责拆分。
