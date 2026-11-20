# liyue-pixel-plants

一个给 AI Agent 用的**像素植物生成 Skill**。让它画一棵会随风摆动的像素树、一丛灌木、一枝花——不用自己写动画引擎。

## 它能做什么

引擎在 `assets/pixel-flora.js`，内置六种植物：

| preset | 中文 | 特征 |
| --- | --- | --- |
| `pear` | 梨 | 高干、竖椭圆冠、白花 |
| `peach` | 桃 | 矮些、圆厚冠、暖粉 |
| `cherry` | 樱 | 更矮更宽、粉近白、垂得多 |
| `ginkgo` | 银杏 | 高直干、上尖下宽、金叶 |
| `bush` | 灌木 | 无干、扁圆贴地、绿 |
| `pine` | 松 | 高直干、瘦高锥冠、墨绿针叶 |

风、落花、摇晃、掉叶、点击局部抖动都在引擎里。也支持按配方加新树种（枫、梅、柳、果树等）。

## 包含什么

```
SKILL.md                  用法、四层结构、验收判据、常见故障
references/species.md     全部参数含义 + 六种植物实际数值 + 新树种配方
assets/pixel-flora.js     引擎（无依赖，原生 JS）
assets/demo.html          六种并排对照 (?all=1) / 单株 (?p=cherry)
assets/pine.html          松树单株展示页（风力挡位 + 点击 shake）
```

## 安装

克隆仓库：

```bash
git clone https://github.com/LiyueDev/liyue-pixel-plants.git
```

把 `liyue-pixel-plants/` 目录复制到你的 Agent skills 目录：

| Agent | Skills 目录 |
| --- | --- |
| WorkBuddy | `~/.workbuddy/skills/` |
| Claude Code | `~/.claude/skills/` |
| Codex | `~/.codex/skills/` |

Windows PowerShell:

```powershell
git clone https://github.com/LiyueDev/liyue-pixel-plants.git
Copy-Item -Recurse .\liyue-pixel-plants "$HOME\.workbuddy\skills\"
```

复制完重启 Agent 或刷新 Skill 列表。

## 使用

装好后用自然语言说就行：

- 「画一棵会摇的樱花树放在页面右下角」
- 「把那棵树换成银杏，风大一点」
- 「照着梨树的风格再做一棵枫树」
- 「在页面里加一丛贴地的灌木」

## 直接当 JS 库用

不经过 Agent 也能单独用引擎，零依赖：

```html
<div id="stage" style="position:fixed;inset:0"></div>
<script src="pixel-flora.js"></script>
<script>
  PF.mount(document.getElementById("stage"), { name: "cherry", strength: 1, gusts: 0.85 });
</script>
```

`PF.mount` 自己管 DPR、整数倍缩放、渐变灰布景和 rAF 循环。详细 API 见 `SKILL.md`。

打开 `assets/demo.html` 看效果：`?all=1` 六种并排，`?p=pine` 看单株。

## 许可

MIT
