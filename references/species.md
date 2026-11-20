# 参数与配方

引擎默认值在 `assets/pixel-flora.js` 的 `DEFAULTS` 里，preset 只写"和默认不同"的那几项，
两者深度合并（数组整体覆盖，不逐项合并）。所以改一个树的形，只写 `trunk` / `crown` / `branches` 即可。

## 参数分组

| 组 | 键 | 含义 / 手感 |
| --- | --- | --- |
| `spec` | `w,h` | 逻辑画布（像素格坐标），树在这张画里画 |
| | `baseX,baseY` | 树根位置；`baseY` 就是地面线，树干基部会补画到这里 |
| | `padX,padY` | 画布留白，给大风/拖拽时荡出去的冠留余量（默认 56 / 12） |
| | `seed` | 全部随机都由它派生，同 seed 同形 |
| `trunk` | `height` | 主干高度（像素），决定"高干/矮干" |
| | `segs` | 段数，段多=弯得顺；`branches` 里的 frac 就是按段数取 |
| | `wBase` / `taper` / `segW` | 根粗 / 收细比例 / 最小段宽 |
| | `lean` / `wob` | 整体倾角 / 每段的自然摆动（大=歪脖子） |
| `branches` | `[frac, angle, len]` | frac 从主干哪一段起（0 底 1 顶），angle 弧度（>1 张得开），len 像素长度 |
| `branch` | `wFactor` | 枝粗 = 起段粗 × 这个比例 |
| | `forks` / `forkAng` | 分几叉 / 分叉角 |
| | `twigLen` / `tipLen` / `tipProb` | 二级枝长 / 三级枝长 / 出三级枝的概率 |
| | `bend` / `twigBend` / `tipBend` | 每级的柔软度（风里的弯度），越大越飘 |
| `crown` | `dy` | 冠心相对 `baseY` 的偏移（负=在上方）；`baseY+dy` 是冠心 |
| | `rx, ry` | 横向 / 纵向半径，`rx>ry` 扁平，`ry>rx` 竖长 |
| | `shape` | `pear`(上窄下宽) `round`(圆，底更满) `cone`(锥，顶尖) `bush`(扁圆贴地) `fan`(上圆下压) |
| | `squash` | 只对 pear 有效，下缘压扁程度 |
| `balls` | `count / rMin / rMax / gap` | 团数量 / 团半径范围 / 最小圆心间距（gap 大=能看见枝子） |
| | `topPad / botPad` | 团离画面顶部 / 离地面的最小距离 |
| | `toneBase / toneSlope` | 团的明暗：`tone = toneBase - ny*toneSlope`，正数偏亮 |
| `inner` | `count / rMin / rMax` | 冠心里垫的底团，把团连成整体（bias 固定 -0.95，偏暗） |
| `blooms` | `count / spread` | 单朵花数量 / 摊开倍数（>1 会溢到冠外当毛边） |
| `droop` | `count / span / y0 / y1` | 冠底垂下的簇：数量 / 横向范围 / 起始高度比例 / 纵向跨度 |
| `tips` | `perJoint / levelMin / r` | 每个枝梢点几朵 / 从第几级关节开始 / 散布半径 |
| `edge` | `count / r0 / r1` | 冠外零星碎瓣（用 faller 的小图，`tiny` 标记，摇的时候最容易掉） |
| `ground` | `petals / spread` | 树下地上的落花数量 / 摊开范围 `[内,外]` |
| `ball` | `stamp` | 团上撒什么：`blossom` / `fan` / `leaflet` |
| | `petal inner cast heartA heartB` | 花瓣色 / 内瓣色 / 衬色 / 两种花心 |
| | `density` | 每团撒几个（≈ 半径 × density） |
| `single` | `stamp count petal inner ...` | 单朵的形与色，`count` 是生成的变体数量（随机花心） |
| `faller` | `shape petal soft heart` | 飘落的形：`petal`(碎瓣) `flower`(小整花) `fan`(银杏叶) |

`STAMPS` 的像素字：

```
blossom : 5×5 五指花，X 瓣 / W 内瓣 / i 衬色 / o 花心（梨、桃、樱共用）
fan     : 8×5 扇形叶，下缘收成柄（银杏）
leaflet : 4×3 小尖叶（灌木）
```

加新字形：`rows` 数组即可，再给 `dx dy cw ch cx cy bxo byo`（画在哪、锚点在哪儿、往团上撒时的偏移）。

## 六种现成植物

| | 梨 pear | 桃 peach | 樱 cherry | 银杏 ginkgo | 灌木 bush | 松 pine |
| --- | --- | --- | --- | --- | --- | --- |
| `trunk.height` | 140 | 118 | 96 | 168 | 8 | 190 |
| `trunk.segs` | 12 | 11 | 10 | 15 | 3 | 16 |
| `trunk.wBase` | 11.5 | 10.5 | 9.5 | 10.5 | 4.5 | 11.5 |
| `trunk.lean / wob` | -0.006 / 0.3 | -0.02 / 0.42 | 0.05 / 0.55 | 0 / 0.18 | 0 / 0.06 | 0 / 0.2 |
| 主枝数 | 5 | 5 | 6 | 8 | 8 | 7 |
| 张开角区间 | 0.18–1.06 | 0.24–1.18 | 0.34–1.36 | 0.10–1.02 | 0.04–1.35 | 0.38–1.00 |
| `crown.dy / rx / ry` | -158 / 98 / 84 | -134 / 106 / 88 | -108 / 116 / 92 | -132 / 88 / 100 | -40 / 66 / 42 | -132 / 74 / 120 |
| `crown.shape` | pear | round | round | cone | bush | cone |
| 团数 / 半径 | 86 / 14–19 | 88 / 13–18 | 104 / 11–17 | 82 / 10–16 | 60 / 9–15 | 130 / 7–11 |
| 单朵 / 落瓣 | 110 / 44 | 120 / 44 | 170 / 44 | 120 / 44 | 44 / 14 | 110 / 14 |
| 花叶形 | blossom 白 | blossom 粉 | blossom 浅粉 | fan 金 | leaflet 绿 | needles 墨绿 |
| 视觉记忆点 | 高干直、冠竖椭圆、白花 | 矮些、冠圆而厚、暖粉 | 更矮更宽、粉近白、垂得多 | 干高直、冠上尖下宽、金叶 | 无干、扁圆贴地、绿 | 干高直、瘦高锥冠、针叶碎、横枝露缝 |

### 改哪个数会怎样

- 想更高：`trunk.height` ↑（同时 `crown.dy` 要跟着更负，否则冠贴地）。
- 想更宽：`crown.rx` ↑，`balls.count` 同步 ↑，`gap` 不变，否则会稀。
- 想更"蓬"：`balls.count` ↑ + `rMin/rMax` 小一档（小团多=毛茸茸；大团少=棉花团）。
- 想看见枝子：`gap` ↑ 到 10–12，`blooms.count` 保持，枝从缝里露出来。
- 想更"秋"：`palette` 的 `bloom` 换暖色、`faller.shape` 用 `fan`。
- 想更小（当灌木用）：`spec.w/h` 缩小 + `padX/padY` 缩到 30/10，`trunk.height` 只要 8–20。

## 新树种配方（照抄再改）

**枫**：`crown.shape:"round"`,`rx:110 ry:80`，`branches` 6 条角 0.9–1.3（横张），`trunk.height:110`，
`bloom` 走红橙 `["#8A3B22","#B25430","#CE7A42","#E39B5A","#F2BC7C","#F8D7A4","#D2703A"]`，
`ball.stamp` 用 `leaflet` 加一档（或新写一个 3 裂 `rows`）。

**松（已实现为 `PRESETS.pine`，展示页 `assets/pine.html`）**：`crown.shape:"cone"`,`rx:74 ry:120`，
`trunk.height:190`、`segs:16`、`lean:0`；7 条短枝横展（角 0.38–1.00）；`bloom` 走墨绿，
`ball.stamp`/`single.stamp` 用新字形 `needles`（顶端散针、下收成束），`faller` 走 `petal` 绿色碎针。
**踩坑**：初版照旧配方给 `balls.count:40 gap:12`，出来是稀阔叶树；改成 `count:130 rMin/rMax:7/11 gap:6`
才连成塔形，`inner.count:30` 垫暗底填缝；`edge.count` 压到 6、`tips.perJoint` 降到 1，否则冠外散针太多。

**柳**：`crown.shape:"bush"`,`dy:-150 ry:60 rx:90`，`branch.tipLen:[40,60]`、`tipBend:0.06`（细长垂枝），
`droop.count:80`、`droop.y0:0.5 y1:0.7`（大量下垂簇），`bloom` 黄绿，`ball.rMax` 压到 12（碎）。

**梅**：`trunk.height:70`、`segs:8`、`wob:0.8`（虬曲），`branches` 4 条角 1.0–1.4 且 `len` 短，
`crown` 不做整冠：`balls.count:26`、`blooms.count:40`、`droop.count:6`——花贴着枝开，不堆成球。

**果树（苹果/桃实）**：在 `single` 之外再加一层"果"：`makeSingle` 换 `rows` 为 2×2 实心块、`petal` 用果色，
并把 `tips.perJoint` 调 1、`edge.count` 调 0，让果子挂在枝头不飘。
