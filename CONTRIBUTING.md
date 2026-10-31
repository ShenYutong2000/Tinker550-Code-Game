# 团队协作

## 开始开发

安装符合 `package.json` 中 `engines.node` 范围的 Node.js，在仓库根目录运行：

```bash
npm ci
npm run dev
```

提交改动前运行 `npm run check`。它依次检查 JavaScript 语法、原型基准与业务测试、生产构建，以及构建后入口和导出流程。GitHub Actions 在推送和 PR 上运行同一命令。

## 三人并行修改的边界

| 工作方向 | 主要目录 | 合并前需要核对 |
| --- | --- | --- |
| 页面与交互呈现 | `src/ui/`, `src/styles/`, `index.html` | 三个视口、模板中的 `data-*` 与事件绑定 |
| 教学对话与设计逻辑 | `src/conversation/`, `src/design/` | 两轮迭代、引导时机、现有文案与解析结果 |
| 游戏运行与项目数据 | `src/game/`, `src/state/` | 试玩、导出、旧 `v6` 项目保存与加载 |

`src/app.js` 是接线入口。修改跨模块接口前，先在 PR 中写清需要传入的状态或回调；尽量让各模块通过明确参数交互。一个变更涉及多个方向时，由改动者更新对应模块与测试，再请另一方向的成员复核。

## 修改原则

- 当前整理阶段以原型为准。未经产品决定，不改页面文案、DOM 顺序、CSS 断点、游戏规则或已保存项目的格式。
- 展示模板放在 `src/ui/templates.js`，DOM 更新放在 `src/ui/render.js`，对话状态转换放在 `src/conversation/flow.js`，事件绑定放在 `src/events/bind.js`。
- 使用 `src/state/storage.js` 读写项目；游戏配置由 `src/state/project.js` 生成。不要在界面事件中创建另一套存储键或配置格式。
- 只为真实行为风险补测试。新增交互至少覆盖正常路径和一个关键恢复路径；有意改版时更新基准测试与手工验收记录。
- `baseline/` 保留原始验收资料；`dist/` 和 `node_modules/` 是本地生成物。

## PR 验收

说明改了什么、为什么改、如何验证，以及是否影响现有 `v6` 数据或独立 HTML。运行 `npm run check`，再按 [完整手工验收清单](docs/acceptance.md) 核对受影响的视口与流程。随机 Canvas 动画和机器人打字效果按行为验收，不要求逐帧一致。
