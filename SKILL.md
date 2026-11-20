---
name: liyue-pixel-plants
description: 用黎月像素风格生成"会随风摆动的植物"——一棵树、一丛灌木、一枝花。引擎已在 assets/pixel-flora.js 里，能出梨花、桃花、樱花、银杏、灌木、松树六种，也可按新树种改参数复现（枫、梅、柳、果树等）。当用户要做像素树/花树/灌木/行道树/秋天的树/松树，或说"再做一棵同风格的xx树""把树换成樱花"，或需要在页面里加一棵会摇的像素植物时使用。
---

# pixel-flora · 像素植物

一棵植物的做法是固定的四层，改哪一层就换哪一种植物：

1. **骨架** — 主干关节链 + 主枝 + 分叉 + 枝梢（`trunk` / `branches` / `branch`）
2. **冠** — 一段椭圆体积，用轮廓函数切出梨形/圆/锥/扁（`crown`）
3. **团** — 冠里塞一堆碎边像素团，团上撒花或叶（`balls` / `inner` / `blooms` / `droop` / `tips` / `edge`）
4. **色与形** — 调色板 + 花/叶的像素字形（`palette` / `ball` / `single` / `faller`）

风、落花、摇晃、掉叶都已经在引擎里，不用重写。

## 用法

```html
<div id="stage" style="position:fixed;inset:0"></div>
<script src="pixel-flora.js"></script>
<script>
  PF.mount(document.getElementById("stage"), { name: "cherry", strength: 1, gusts: 0.85 });
</script>
```

`PF.mount(容器, 选项)` 自己管 DPR、整数倍缩放、渐变灰布景、rAF 循环，返回
`{ plant, canvas, redraw, relayout, stop, shake(x,y), regrowAll }`。
容器必须有尺寸（`position:fixed;inset:0`、或 flex/grid 撑开），量不到就退回视口尺寸。

不要 `mount`（只要树、自己画）：

```js
var plant = PF.build("ginkgo");        // 或 PF.build({ name:"x", ... })
// 每帧：plant.wind.step(dt); PF.step(plant, t, dt); PF.paint(plant);
// plant.canvas 是逻辑画布（含 pad 余量），按整数倍最近邻放大贴到页面
```

| 方法 | 作用 |
| --- | --- |
| `PF.build(name \| cfg, {dark})` | 造植物，返回 plant（内含 wind） |
| `PF.step(plant, t, dt)` | 摆姿态 + 掉花 + 补花，t 用秒 |
| `PF.paint(plant)` | 重画 plant.canvas |
| `PF.shake(plant, x, y, t, power)` | 点一下的局部抖（power 默认 0.046） |
| `PF.regrow(plant, t)` | 把掉光的补回去 |
| `PF.presets` | pear / peach / cherry / ginkgo / bush / pine |
| `PF.drawFloor(ctx,w,h,bg,ax,ay)` | 渐变灰布景 + 落影（ax/ay 是树根位置，六个参数别漏） |

## 加一个新树种（五步）

1. **骨架**：先定 `spec`（`w/h/baseX/baseY` 是逻辑画布与地面的位置，`padX/padY` 是给甩出留的余量），再定 `trunk`（`height` 高、`segs` 段数、`wBase` 根粗、`lean/wob` 直不直）。
2. **枝**：`branches` 每项 `[从主干多少处, 张开角, 长度]`，角大=开张（桃/樱），角小=收拢直立（银杏/杨）。
3. **冠**：`crown.dy` 是冠心离地面的高度（负值往上），`rx/ry` 是横竖半径，`shape` 选 `pear|round|cone|bush|fan`。
   `balls.count / rMin / rMax / gap` 决定"团"的密度和颗粒感。
4. **色**：在 `PALETTES` 里加一条浅底、一条暗底，`bloom` 必须是 7 档，从"最暗"到"最亮"再到"花色"，`[0]` 是冠的阴影、`[3]` 是主体、`[4]` 是受光。
5. **花/叶形**：`STAMPS` 里加 `rows` 像素字（`.` 空、`X` 瓣、`W` 内瓣、`o` 花心），`ball.stamp` / `single.stamp` 指过去。

改完必须打开 `assets/demo.html` 看：`?p=<preset>` 单个，`?all=1` 六种并排对照。松树另有单株展示页 `assets/pine.html`（标题 + 风力挡位 + 点击 shake），可直接拿去演示。

## 验收判据

- 冠外轮廓不能是直边矩形 / 被画布边切掉 → 加 `padX/padY`，或让 `crown.rx+balls.rMax ≤ spec.w/2 - 12`。
- 白/浅色花在浅灰底上看不见 → `bloom[0..1]` 至少比底色低两档明度，底用渐变灰不要用近白。
- 团和团之间要能看见枝子（`gap`），不然是一坨棉花。
- 树干最低一节必须一路画到 `spec.baseY+2` 并微张（引擎已做，别改回横条堆叠，否则弯折处会露黑缝）。
- 落花开场就有几片在飘（`mount` 里预铺 16 片），不然画面是死的。
- 动画只在 `wind.manual` 为真时才摘花；默认只摆不掉，免得一开页就秃。

## 常见故障

| 现象 | 原因 |
| --- | --- |
| 整棵植物缩在角落里很小 | 容器没有尺寸（`position:fixed` 被别的 CSS 覆盖 / 刚挂 DOM 还没布局）→ 引擎会退回视口，但更好的做法是给容器显式宽高 |
| 冠被硬边切掉 | `padX/padY` 给小了，或 `crown.rx` 超过 `spec.w/2` |
| 一片糊，看不出是花 | `balls.rMin/rMax` 太大或 `gap` 太小；把团缩小、加大 `gap`，单朵 `blooms.count` 拉高到 120+ 勾边 |
| 枝条穿出冠外露一小截 | 收短 `branches` 长度 / `branch.twigLen` / `tipLen`，或把 `tips.levelMin` 降到 1 让末端也有叶 |
| 花看着"脏" | 调色板里 `[0][1]` 太饱和，或者花心色太跳；花心只在 `o` 那个像素上换色 |

参数含义与六种植物的实际数值见 `references/species.md`。

## 截图验证（Windows headless）

```powershell
$chrome="C:\Program Files\Google\Chrome\Application\chrome.exe"
$url = "file:///" + (Resolve-Path "./assets/demo.html").Path.Replace("\","/") + "?p=cherry"
& $chrome --headless=new --disable-gpu --no-first-run --hide-scrollbars `
  --force-device-scale-factor=1 --window-size=1440,900 --virtual-time-budget=2600 `
  --user-data-dir="$env:TEMP\pf-shot" --screenshot="$env:TEMP\pf.png" $url
```

（在 skill 根目录执行；`$url` 用当前路径拼出 `file:///` 地址，换机器不用改。）

rAF 在 headless 里几乎不推进，抬眼看形状够用；要验证"风把树吹弯 / 掉花"，注入探针后手动
`plant.wind.step(dt)` 再读状态，别指望 virtual-time 自己跑风。
