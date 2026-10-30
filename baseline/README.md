# Tinkercade 原型基准（第一步）

本目录用于后续结构整理时核对页面与交互。`source/Tinker 550.html` 是用户提供的原始文件的逐字节副本；第一步没有修改其代码。

## 原始文件

- 来源：`C:\Users\Lenovo\Downloads\Tinker 550.html`
- 仓库副本：`source/Tinker 550.html`
- 大小：122,488 字节
- SHA-256（来源与副本一致）：`C1B466C8785B11B2B401563119FBF156B6F782E9E14BC7A511BE071F83B286E8`

可用 PowerShell 核对：

```powershell
Get-FileHash -LiteralPath 'baseline\source\Tinker 550.html' -Algorithm SHA256
```

## 截图基准

使用全新、未保存该站点数据的浏览器会话，通过本地静态服务器打开原始文件。采集前等待 `document.fonts.ready`，并等待机器人首轮两条消息与命名选项全部出现。浏览器设备像素比为 1；截图为 JPEG。浏览器缩放保持默认值。

- `screenshots/desktop-1440x900.jpg`：桌面首屏，侧栏与对话区并列。
- `screenshots/tablet-1024x768.jpg`：平板首屏，侧栏宽度缩小。
- `screenshots/mobile-390x844.jpg`：手机首屏，侧栏收起，底部显示 CREATE / PREVIEW / MAP 导航。
- `screenshots/design-board-desktop.jpg`：示例游戏的两张笔记确认后的设计地图。
- `screenshots/game-preview-desktop.jpg`：示例游戏的 v1 试玩面板。Canvas 含随机元素与持续动画，不以逐像素相同作为验收条件。
- `screenshots/export-dialog-desktop.jpg`：普通浏览器中的单文件 HTML 导出弹窗。

可将 `baseline/source` 作为静态服务器根目录，再访问 `http://127.0.0.1:8765/Tinker%20550.html`。示例命令：

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory baseline/source
```

如果本机的 `python` 命令不可用，换成已安装的 Python 可执行文件路径即可。首次使用测试需要清空此本地地址的站点数据，或使用新的浏览器会话；否则机器人名称与项目列表会沿用 `localStorage` 中的旧值。

## 已实际走通的流程

下列步骤在桌面视口执行，示例输入固定为机器人名称 `Bolt`、角色 `a cat`、动作 `catching stars`。引导卡片会按顺序覆盖操作区域，须先点击其 `Got it` / `OK` 再继续。

1. **命名**：首屏显示机器人问候和命名提示；点击 `Bolt` 后，侧栏显示 `Buddy: Bolt`，对话出现角色与动作的问题，以及两个输入框。
2. **创建游戏**：在 `Who` 填写 `a cat`，在 `Doing what` 填写 `catching stars`，点击 `Got it!`。标题自动变为 `Cat: Catching Stars`；对话说明创建了两张红色笔记，设计地图随后自动打开。
3. **设计地图**：首次使用依次出现地图、返回入口、笔记确认、角色、目标及生成按钮的引导。地图显示 `🐱 cat` 与 `“catching stars”` 两张红色笔记；逐张点击后变为黄色，侧栏地图计数为 `2`，`Make my game!` 可用。地图标题标明 `Fullerton's 8 formal elements`。
4. **生成与预测**：点击 `Make my game!`，对话询问 `When the cat catches a star, what will the game do?`，提供“得 1 分”“猫变大并发光”“星星弹开”三个预测选项和自由输入。选择 `you get 1 point`，点击 `I think so!` 后出现可点击的游戏卡片；侧栏出现已保存的 `Cat: Catching Stars` 项目。
5. **试玩**：点击游戏卡片，右侧展开标为 `v1` 的游戏面板，Canvas 显示猫与下落的星星，说明栏显示左右键及鼠标控制。点击画布后画布获得焦点，已向其发送左方向键。约五秒后出现询问试玩结果的提示。
6. **保存与加载**：点击顶部 `Save`；再点击 `New project`，出现 `This project is already saved` 提示，当前对话回到新项目状态，旧项目仍列在侧栏。点击侧栏的 `Cat: Catching Stars`，标题、对话及两张已确认笔记恢复。
7. **导出**：在 v1 游戏面板点击 `Export HTML`。普通浏览器显示 `Export HTML / A one-file mini game` 弹窗，提示将代码保存为 `Cat_ Catching Stars.html`。点击 `Copy code` 出现 `Copied!`；本次复制的 HTML 为 16,770 个字符，包含 Canvas、游戏引擎和当前游戏配置。

## 后续结构整理的验收用法

每次拆分后，在同一浏览器、相同视口及字体加载完成的条件下对照首屏与弹窗。动态内容（机器人打字、随机 Logo 动画、Canvas 帧、临时提示）按出现时机和行为核对；保存格式、对话文案、设计笔记、生成配置及导出结果按流程核对。原始文件只作基准，不在后续步骤中编辑。
