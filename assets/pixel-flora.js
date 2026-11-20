/* ============================================================
   pixel-flora.js — 像素植物引擎（风的骨架 + 着色 + 落花 + 布景）
   从 wind-tree.html 里拆出来的核心：不含任何页面 UI、不含具体场景。
   用法：
     var plant = PF.build("pear");                  // 或 PF.build(cfg)
     PF.mount(document.getElementById("stage"), {name:"pear"});
   ============================================================ */
(function (global) {
  "use strict";

  /* ---------- 基础 ---------- */
  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function rnd(rng, a, b) { return a + rng() * (b - a); }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function mk(w, h) {
    var cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    var c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    return { cv: cv, c: c };
  }

  /* ---------- 调色板（浅底 / 暗底两套，只是色值） ---------- */
  var PALETTES = {
    /* 梨花：白花，枝灰褐。阴影压蓝灰，花近纯白 */
    pear: {
      light: {
        bark: ["#3A2C25", "#513E34", "#7A6152"],
        bloom: ["#A2AEC0", "#BDC8D8", "#DCE3EE", "#EFF3F9", "#FDFDFE", "#FBEDF1", "#F4D8E1"],
        soil: ["#E4E9F1", "#F2F5FA", "#FCFCFE", "#F5E2E8"],
        grass: ["#8FAC85", "#A9C49E", "#C6D9BB"]
      },
      dark: {
        bark: ["#2E211B", "#5C4437", "#7E5F4C"],
        bloom: ["#7C8CA8", "#9AAAC2", "#C2D0E2", "#E6EDF8", "#FDFDFE", "#FCEFF3", "#F6DCE5"],
        soil: ["#333F55", "#3C4A62", "#4A5875", "#EFD7E0"],
        grass: ["#2A3A4A", "#3D5370", "#546F90"]
      }
    },
    /* 桃花：粉偏暖，花心深一点，冠比梨圆 */
    peach: {
      light: {
        bark: ["#4A3226", "#654636", "#8A6550"],
        bloom: ["#C4859B", "#E2A9BA", "#F4C7D3", "#FBDDE5", "#FFF2F6", "#FFF8FA", "#F5CFD9"],
        soil: ["#E8DDE4", "#F6EDF1", "#FFFAFC", "#F2D2DD"],
        grass: ["#93AE83", "#ADC79B", "#CBDCB7"]
      },
      dark: {
        bark: ["#33231B", "#5E4234", "#83604C"],
        bloom: ["#8C5A70", "#B0788C", "#D59CAC", "#F2CAD7", "#FFF0F5", "#FFF7FA", "#F3CBD9"],
        soil: ["#3A3140", "#463A4E", "#554858", "#E8CBD6"],
        grass: ["#2A3A4A", "#3D5370", "#546F90"]
      }
    },
    /* 樱花：更浅、更透的粉，边缘几乎化开 */
    cherry: {
      light: {
        bark: ["#4C3A32", "#6A5348", "#8E7466"],
        bloom: ["#C79BB0", "#E2BCCD", "#F5D2E0", "#FCE4EE", "#FFF6FA", "#FFFBFC", "#F7DBE7"],
        soil: ["#EADFE6", "#F7EEF3", "#FFFBFD", "#F3D6E2"],
        grass: ["#93AE83", "#ADC79B", "#CBDCB7"]
      },
      dark: {
        bark: ["#352620", "#5C453B", "#7F665A"],
        bloom: ["#8A6478", "#AE8598", "#D2A9B8", "#F0CFDD", "#FFF2F8", "#FFF9FC", "#F4D2E2"],
        soil: ["#3B3140", "#47394E", "#564858", "#EACBD7"],
        grass: ["#2A3A4A", "#3D5370", "#546F90"]
      }
    },
    /* 银杏：叶是扇形金片，秋色 */
    ginkgo: {
      light: {
        bark: ["#4A3B31", "#665243", "#8C7460"],
        bloom: ["#A9772A", "#C89335", "#E4AE45", "#F4C95F", "#FBDD8B", "#FDEBBA", "#EFC05A"],
        soil: ["#E8E0CE", "#F4EEDF", "#FDF8EC", "#EFE0BE"],
        grass: ["#93AE83", "#ADC79B", "#CBDCB7"]
      },
      dark: {
        bark: ["#31251E", "#574334", "#7A5F4C"],
        bloom: ["#6E4C1C", "#9A6C25", "#C0922F", "#E3B346", "#F5D070", "#F9E49C", "#DFAE44"],
        soil: ["#3A3526", "#464030", "#554D39", "#D9C58A"],
        grass: ["#2A3A4A", "#3D5370", "#546F90"]
      }
    },
    /* 灌木：绿色小圆叶，比树矮、比树密 */
    bush: {
      light: {
        bark: ["#3E4A34", "#556345", "#6E7E5A"],
        bloom: ["#4E6B46", "#63805A", "#7E9A6E", "#9CB689", "#BCD2A5", "#D6E5C2", "#AFCB98"],
        soil: ["#DCE3D6", "#EBF0E2", "#F7FAF0", "#D9E4C8"],
        grass: ["#8FAC85", "#A9C49E", "#C6D9BB"]
      },
      dark: {
        bark: ["#2A3324", "#3F4C33", "#556341"],
        bloom: ["#31432F", "#3F5639", "#4E6842", "#67825A", "#86A06F", "#A0BB85", "#7C9764"],
        soil: ["#2E3729", "#39432F", "#454F37", "#9DB47F"],
        grass: ["#2A3A4A", "#3D5370", "#546F90"]
      }
    },
    /* 松树：墨绿针叶，冠是瘦高锥，枝灰褐。阴影压到近黑，浅灰底上轮廓才立得住 */
    pine: {
      light: {
        bark: ["#2B2019", "#4A3628", "#6B513C"],
        bloom: ["#0F2E1D", "#17432A", "#216038", "#2C7D48", "#3C9A58", "#5DBB75", "#2E6E40"],
        soil: ["#E4E9F1", "#F2F5FA", "#FCFCFE", "#E8EEDF"],
        grass: ["#8FAC85", "#A9C49E", "#C6D9BB"]
      },
      dark: {
        bark: ["#1F1712", "#3E2C20", "#5C4633"],
        bloom: ["#0A2115", "#12321F", "#1A4A2B", "#236338", "#317C4A", "#4D9C63", "#245C34"],
        soil: ["#333F55", "#3C4A62", "#4A5875", "#7C9A6A"],
        grass: ["#2A3A4A", "#3D5370", "#546F90"]
      }
    }
  };

  /* ---------- 花/叶的形状（rows 是像素字，`.` 空，X 瓣、W 内瓣、i 衬色、o 花心） ---------- */
  var STAMPS = {
    /* 五指花形：梨、桃、樱都用这个骨架，只是配色不同 */
    blossom: {
      rows: ["..X..", ".XWX.", "XWoiWX", ".XWX.", "..X.."],
      dx: 1, dy: 1, cw: 8, ch: 8, cx: 3, cy: 3, bxo: 2, byo: 2, shadow: "#DCE4F1"
    },
    /* 扇形叶：银杏（上缘扇开，下面收成柄） */
    fan: {
      rows: ["..XXXX..", ".XXXXXX.", "XXXXXXXX", ".XoXXoX.", "..X..X.."],
      dx: 1, dy: 1, cw: 10, ch: 8, cx: 4, cy: 3, bxo: 4, byo: 2, shadow: null
    },
    /* 小尖叶：灌木 */
    leaflet: {
      rows: [".XX.", "XXWX", ".XX."],
      dx: 1, dy: 1, cw: 6, ch: 6, cx: 2, cy: 2, bxo: 2, byo: 1, shadow: null
    },
    /* 针束：松树，顶端三根散针、往下收成一束。X 深针 / W 亮针 */
    needles: {
      rows: ["X.X.X", ".X.X.", "..X..", "..X.."],
      dx: 1, dy: 1, cw: 8, ch: 7, cx: 2, cy: 2, bxo: 2, byo: 2, shadow: null
    }
  };

  /* 一朵花/一片叶：按 rows 盖章，先压一圈淡影，白花才从白团里分得出来 */
  function makeSingle(rng, st, pal, opts) {
    opts = opts || {};
    var o = mk(st.cw, st.ch), c = o.c;
    var rows = st.rows;

    if (st.shadow) {
      for (var y0 = 0; y0 < rows.length; y0++) {
        for (var x0 = 0; x0 < rows[y0].length; x0++) {
          if (rows[y0][x0] === ".") continue;
          c.fillStyle = st.shadow;
          c.fillRect(x0 + st.dx + 1, y0 + st.dy + 1, 1, 1);
        }
      }
    }
    var heart = opts.heart || (rng() < 0.4 ? "#E79AAF" : "#E4D3A6");
    var petal = opts.petal || "#FFFFFF";
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var ch = rows[y][x];
        if (ch === ".") continue;
        c.fillStyle = ch === "X" ? petal
          : (ch === "W" ? (opts.inner || "#F8E4EA")
            : (ch === "o" ? heart
              : (ch === "i" ? (opts.cast || "#F4D8E1") : pal.bloom[Math.min(2, pal.bloom.length - 1)])));
        c.fillRect(x + st.dx, y + st.dy, 1, 1);
      }
    }
    return { cv: o.cv, ox: st.cx, oy: st.cy };
  }

  /* 一团花/叶：先画一个碎边圆团（bloom 渐层），再把小花撒上去 */
  function makeBall(rng, r, bias, cfg) {
    var st = STAMPS[cfg.ball.stamp];
    var size = r * 2 + 5;
    var o = mk(size, size), c = o.c;
    var cx = r + 2, cy = r + 2;
    var pal = cfg.pal;
    var s1 = rng() * 99, s2 = rng() * 99;
    var base = Math.max(1, Math.min(3, Math.round(2 + bias + (cfg.dark ? -0.7 : 0))));

    for (var y = -r; y <= r; y++) {
      for (var x = -r; x <= r; x++) {
        var d = Math.sqrt(x * x + y * y);
        var ang = Math.atan2(y, x);
        var edge = r * (1 + 0.1 * Math.sin(ang * 3 + s1) + 0.07 * Math.sin(ang * 5.4 + s2));
        if (d > edge) continue;
        if (d > edge - 1.5 && rng() < 0.42) continue;
        var g = (x + y * 1.25) / r;
        var idx = base;
        if (g < -0.5) idx += 1;
        else if (g > 0.55) idx -= 1;
        if (d > edge - 2.2 && rng() < 0.2) idx -= 1;
        if (rng() < 0.05) idx += rng() < 0.6 ? 1 : -1;
        idx = Math.max(0, Math.min(pal.bloom.length - 1, idx));
        c.fillStyle = pal.bloom[idx];
        c.fillRect(cx + x, cy + y, 1, 1);
      }
    }

    /* 撒花：靠外多一点，这样团子边缘是碎的 */
    var nb = Math.round(r * cfg.ball.density);
    for (var i = 0; i < nb; i++) {
      var a = rng() * 6.283, rr = Math.sqrt(rng()) * (r - 1.5);
      var bx = Math.round(Math.cos(a) * rr), by = Math.round(Math.sin(a) * rr);
      if (bx * bx + by * by > r * r * 0.92) continue;
      var heart = rng() < 0.38 ? cfg.ball.heartA : cfg.ball.heartB;
      var rows = st.rows;
      for (var ry = 0; ry < rows.length; ry++) {
        for (var rx = 0; rx < rows[ry].length; rx++) {
          var ch = rows[ry][rx];
          if (ch === ".") continue;
          c.fillStyle = ch === "X" ? cfg.ball.petal
            : (ch === "W" ? cfg.ball.inner
              : (ch === "o" ? heart
                : (ch === "i" ? cfg.ball.cast : cfg.ball.petal)));
          c.fillRect(cx + bx + rx - st.bxo, cy + by + ry - st.byo, 1, 1);
        }
      }
    }
    return { cv: o.cv, ox: cx, oy: cy };
  }

  /* 落下的花瓣/叶 */
  function makeFaller(rng, cfg) {
    var k = cfg.faller.shape;
    var pal = cfg.pal;
    if (k === "flower") {
      var o = mk(6, 6), c = o.c;
      var rows = [".X.", "XoX", ".X."];
      for (var y = 0; y < 3; y++) for (var x = 0; x < 3; x++) {
        if (rows[y][x] === ".") continue;
        c.fillStyle = rows[y][x] === "o" ? cfg.faller.heart : cfg.faller.petal;
        c.fillRect(x + 1, y + 1, 1, 1);
      }
      return { cv: o.cv, ox: 2, oy: 2 };
    }
    if (k === "fan") {
      var f = mk(5, 5), fc = f.c;
      fc.fillStyle = cfg.faller.soft;
      fc.fillRect(1, 1, 3, 1); fc.fillRect(0, 2, 5, 1); fc.fillRect(1, 3, 1, 1);
      fc.fillStyle = cfg.faller.petal;
      fc.fillRect(2, 2, 2, 1); fc.fillRect(1, 2, 1, 1);
      return { cv: f.cv, ox: 2, oy: 2 };
    }
    /* petal：两粒像素的花瓣 */
    var p = mk(4, 4), pc = p.c;
    var s = rng() < 0.4 ? cfg.faller.soft : cfg.faller.petal;
    pc.fillStyle = s;
    if (rng() < 0.5) { pc.fillRect(0, 1, 2, 1); pc.fillRect(1, 0, 1, 2); }
    else { pc.fillRect(1, 0, 1, 3); }
    return { cv: p.cv, ox: 1, oy: 1 };
  }

  /* 灌木上掉下来的小叶 */
  function makeLeafSprite(rng, light) {
    var o = mk(4, 4), c = o.c;
    var gs = PF_PAL_GRASS;
    var a = gs[light ? 2 : 1], b = gs[light ? 1 : 0];
    c.fillStyle = a;
    c.fillRect(1, 0, 2, 1); c.fillRect(0, 1, 3, 1); c.fillRect(1, 2, 1, 1);
    c.fillStyle = b;
    c.fillRect(1, 1, 1, 1); c.fillRect(2, 2, 1, 1);
    return { cv: o.cv, ox: 1, oy: 1 };
  }
  var PF_PAL_GRASS = ["#8FAC85", "#A9C49E", "#C6D9BB"];

  /* ============================================================
     布局：所有植物共用的一套参数
     ============================================================ */
  var DEFAULTS = {
    spec: { name: "梨花", w: 320, h: 300, baseX: 158, baseY: 278, seed: 20261, padX: 56, padY: 12 },
    /* 主干：高度、段数、根宽、倾斜、摆动、收细 */
    trunk: { height: 140, segs: 12, wBase: 11.5, lean: -0.006, wob: 0.3, taper: 0.62, segW: 3 },
    /* 主枝：每项 [从主干多少处, 张开角, 长度] */
    branches: [[0.58, 1.06, 50], [0.70, 0.92, 46], [0.80, 0.66, 42], [0.88, 0.38, 36], [0.95, 0.18, 30]],
    branch: {
      wFactor: 0.55, forks: 2, twigLen: [24, 34], forkAng: [0.26, 0.46],
      tipLen: [16, 24], tipProb: 0.85, curve: 0.05, bend: 0.03,
      twigCurve: 0.1, twigBend: 0.026, tipCurve: 0.08, tipBend: 0.02
    },
    /* 冠：椭圆中心相对 baseY 的偏移、半径、轮廓形状、下缘压扁 */
    crown: { dy: -158, rx: 98, ry: 84, shape: "pear", squash: 0.26 },
    balls: { count: 86, rMin: 14, rMax: 19, gap: 9, topPad: 10, botPad: 34, toneBase: 0.7, toneSlope: 1.8 },
    inner: { count: 18, rMin: 12, rMax: 16 },
    blooms: { count: 110, spread: 1.04 },
    droop: { count: 26, span: 0.66, y0: 0.76, y1: 0.3 },
    tips: { perJoint: 3, levelMin: 2, r: 9 },
    edge: { count: 44, r0: 1.02, r1: 0.16 },
    ground: { petals: 72, spread: [62, 190] },
    ball: { stamp: "blossom", density: 0.95, petal: "#FFFFFF", inner: "#F8E4EA", cast: "#F4D8E1", heartA: "#E79AAF", heartB: "#E4D3A6" },
    single: { stamp: "blossom", petal: "#FFFFFF", inner: "#F8E4EA", heartA: "#E79AAF", heartB: "#E4D3A6", count: 6 },
    faller: { shape: "petal", petal: "#F4DFE6", soft: "#DEBEC9", heart: "#D98EA6" },
    bushFall: false
  };

  /* 深度合并（数组整体覆盖） */
  function merge(base, over) {
    var out = {};
    for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    if (!over) return out;
    for (var k2 in over) if (Object.prototype.hasOwnProperty.call(over, k2)) {
      var b = base[k2], o = over[k2];
      if (o && typeof o === "object" && !Array.isArray(o) && b && typeof b === "object" && !Array.isArray(b)) out[k2] = merge(b, o);
      else out[k2] = o;
    }
    return out;
  }

  /* 冠的轮廓：给一个 -1..1 的纵向位置，返回该高度的半径系数 */
  function crownLimit(shape, ny, squash) {
    if (shape === "round") return ny < 0 ? Math.pow(1 + ny, 0.5) * 1.0 : 1 - 0.42 * ny * ny;
    if (shape === "cone") return ny < 0 ? 0.1 + 0.9 * Math.pow(1 + ny, 0.75) : 1 - 0.32 * ny * ny;
    if (shape === "bush") return ny < 0 ? Math.pow(1 + ny, 0.45) * 0.95 : 1 - 0.5 * ny * ny;
    if (shape === "fan") return ny < 0 ? Math.pow(1 + ny, 0.9) * 1.04 : 1 - 0.38 * ny * ny;
    /* pear：上窄下宽的梨形 */
    return ny < 0 ? Math.pow(1 + ny, 0.62) * 1.06 : 1 - squash * ny * ny;
  }

  /* ============================================================
     造一棵：骨架 → 枝 → 花团 → 落花 → 画布
     ============================================================ */
  function build(cfgOrName, opts) {
    var cfg = merge(DEFAULTS, typeof cfgOrName === "string" ? (PRESETS[cfgOrName] || {}) : cfgOrName);
    var dark = !!(opts && opts.dark);
    var spec = cfg.spec;
    var base = PALETTES[cfg.palette || "pear"];
    var pal = {
      bark: (dark ? base.dark : base.light).bark.slice(),
      bloom: (dark ? base.dark : base.light).bloom.slice(),
      soil: (dark ? base.dark : base.light).soil.slice(),
      grass: (dark ? base.dark : base.light).grass.slice()
    };
    PF_PAL_GRASS = pal.grass;

    var padX = spec.padX, padY = spec.padY;
    var scW = spec.w + padX * 2, scH = spec.h + padY;
    var rng = mulberry32(spec.seed);
    var joints = [], clusters = [];

    function addJoint(parent, dx, dy, w, bend) {
      var p = parent >= 0 ? joints[parent] : null;
      var j = {
        parent: parent, dx: dx, dy: dy, w: w, bend: bend,
        phase: rng() * Math.PI * 2,
        depth: p ? p.depth + 1 : 0,
        level: p ? p.level + 1 : 0,
        rx: p ? p.rx + dx : spec.baseX,
        ry: p ? p.ry + dy : spec.baseY,
        wx: p ? p.rx + dx : spec.baseX,
        wy: p ? p.ry + dy : spec.baseY,
        rot: 0
      };
      joints.push(j);
      return joints.length - 1;
    }
    function grow(start, angle, len, segs, w0, curve, bend) {
      var cur = start, a = angle, step = len / segs;
      for (var i = 0; i < segs; i++) {
        a += curve;
        cur = addJoint(cur, Math.sin(a) * step, -Math.cos(a) * step,
          Math.max(2, Math.round(w0 * (1 - (i / segs) * 0.55))), bend);
      }
      return cur;
    }

    /* 主干 */
    var T = cfg.trunk, cur = -1, yStep = T.height / T.segs;
    for (var i = 0; i < T.segs; i++) {
      var t = i / Math.max(1, T.segs - 1);
      var w = Math.max(T.segW, Math.round(T.wBase * (1 - t * T.taper)));
      var dx = T.lean * yStep + Math.sin(t * 4.2 + 0.7) * T.wob + rnd(rng, -0.5, 0.5);
      cur = addJoint(cur, dx, -yStep, w, 0.007 + 0.004 * t);
    }
    var trunkTop = cur;
    for (var tk = 0; tk <= trunkTop; tk++) { joints[tk].level = 0; joints[tk].depth = 0; }

    /* 主枝 + 分叉 + 枝梢 */
    var B = cfg.branch;
    for (var b = 0; b < cfg.branches.length; b++) {
      var frac = cfg.branches[b][0], angMag = cfg.branches[b][1], limbLen = cfg.branches[b][2];
      var startJ = Math.min(trunkTop, Math.max(0, Math.round(frac * T.segs) - 1));
      var dir = b % 2 ? -1 : 1;
      var ang = dir * (angMag + rnd(rng, -0.08, 0.08));
      var wJ = Math.max(3, Math.round(joints[startJ].w * B.wFactor));
      var limb = grow(startJ, ang, limbLen + rnd(rng, -5, 5), 2, wJ, dir * B.curve, B.bend);
      for (var f = 0; f < B.forks; f++) {
        var forkDir = f ? -1 : 1;
        var twigAng = ang + forkDir * rnd(rng, B.forkAng[0], B.forkAng[1]);
        var twig = grow(limb, twigAng, rnd(rng, B.twigLen[0], B.twigLen[1]), 2,
          Math.max(2, wJ - 1), forkDir * dir * B.twigCurve, B.twigBend);
        if (rng() < B.tipProb) {
          grow(twig, twigAng + forkDir * rnd(rng, 0.16, 0.38),
            rnd(rng, B.tipLen[0], B.tipLen[1]), 1, 2, forkDir * dir * B.tipCurve, B.tipBend);
        }
      }
    }

    /* 花团挂在最近的关节上 */
    function nearestJoint(px, py) {
      var near = 0, nd = 1e9;
      for (var ji = 0; ji < joints.length; ji++) {
        var dd = Math.hypot(joints[ji].rx - px, joints[ji].ry - py) + joints[ji].level * 0.6;
        if (dd < nd) { nd = dd; near = ji; }
      }
      return near;
    }
    var singles = [];
    for (var s0 = 0; s0 < cfg.single.count; s0++) {
      singles.push(makeSingle(rng, STAMPS[cfg.single.stamp], pal, {
        petal: cfg.single.petal, inner: cfg.single.inner,
        heart: rng() < 0.4 ? cfg.single.heartA : cfg.single.heartB
      }));
    }
    var C = cfg.crown;
    var crown = { x: spec.baseX, y: spec.baseY + C.dy, rx: C.rx, ry: C.ry };
    var ballCfg = { pal: pal, dark: dark, ball: cfg.ball };

    function pushAt(px, py, sp, back, edge) {
      var nj = nearestJoint(px, py);
      clusters.push({
        joint: nj,
        ox: Math.round(px - joints[nj].rx),
        oy: Math.round(py - joints[nj].ry),
        sp: sp, back: !!back, edge: edge, state: "on", jitter: rng() * 0.03
      });
    }

    /* 冠体：一堆团，团间留缝，枝子从缝里露出来 */
    var balls = [], tries = 0;
    while (balls.length < cfg.balls.count && tries < 16000) {
      tries++;
      var ny = rng() * 2 - 1;
      var lim = crownLimit(C.shape, ny, C.squash);
      var nx = (rng() * 2 - 1) * lim;
      if (Math.abs(nx) > lim * 0.96) continue;
      var px = crown.x + nx * crown.rx, py = crown.y + ny * crown.ry;
      if (py < cfg.balls.topPad || py > spec.baseY - cfg.balls.botPad) continue;
      var clear = true;
      for (var k2 = 0; k2 < balls.length; k2++) {
        var ddx = balls[k2].x - px, ddy = balls[k2].y - py;
        if (ddx * ddx + ddy * ddy < cfg.balls.gap * cfg.balls.gap) { clear = false; break; }
      }
      if (!clear) continue;
      balls.push({ x: px, y: py, r: Math.round(rnd(rng, cfg.balls.rMin, cfg.balls.rMax)),
        tone: clamp(cfg.balls.toneBase - ny * cfg.balls.toneSlope, -1.2, 1.3) });
    }
    for (var bi = 0; bi < balls.length; bi++) {
      pushAt(balls[bi].x, balls[bi].y, makeBall(rng, balls[bi].r, balls[bi].tone, ballCfg), true, 1);
    }

    /* 冠心里垫几团底色，花团才连得起来 */
    for (var cp = 0; cp < cfg.inner.count; cp++) {
      var cny = rng() * 1.5 - 0.75;
      var clim = crownLimit(C.shape, cny, C.squash);
      var cnx = (rng() * 2 - 1) * clim * 0.78;
      var cpx = crown.x + cnx * crown.rx, cpy = crown.y + cny * crown.ry;
      if (cpy > spec.baseY - (cfg.balls.botPad + 6)) continue;
      pushAt(cpx, cpy, makeBall(rng, Math.round(rnd(rng, cfg.inner.rMin, cfg.inner.rMax)), -0.95, ballCfg), true, 1);
    }

    /* 零散的单朵：勾毛边 */
    var made = 0, btries = 0;
    while (made < cfg.blooms.count && btries < 6000) {
      btries++;
      var bny = rng() * 2 - 1;
      var blim = crownLimit(C.shape, bny, C.squash);
      var bnx = (rng() * 2 - 1) * blim * cfg.blooms.spread;
      var bdd = Math.abs(bnx) / blim;
      if (bdd < 0.6 && rng() < 0.4) continue;
      var bpx = crown.x + bnx * crown.rx, bpy = crown.y + bny * crown.ry;
      if (bpy < 6 || bpy > spec.baseY - (cfg.balls.botPad - 8)) continue;
      pushAt(bpx, bpy, pick(rng, singles), false, clamp(bdd + 0.2, 0.2, 1));
      made++;
    }

    /* 冠底垂下的几簇，破掉平齐的边 */
    for (var hb = 0; hb < cfg.droop.count; hb++) {
      var hx = crown.x + (rng() * 2 - 1) * crown.rx * cfg.droop.span;
      var hy = crown.y + crown.ry * (cfg.droop.y0 + rng() * cfg.droop.y1);
      if (hy > spec.baseY - 20) continue;
      pushAt(hx, hy, rng() < 0.5 ? pick(rng, singles)
        : makeBall(rng, Math.round(rnd(rng, 3, 5)), -0.9, ballCfg), rng() < 0.5, 1);
    }

    /* 枝梢再点几朵，花别离开枝子 */
    for (var ji = 0; ji < joints.length; ji++) {
      var j = joints[ji];
      if (j.level < cfg.tips.levelMin) continue;
      for (var bb = 0; bb < cfg.tips.perJoint; bb++) {
        var ab = rng() * 6.283, rb = Math.sqrt(rng()) * cfg.tips.r;
        pushAt(j.rx + Math.cos(ab) * rb, j.ry + Math.sin(ab) * rb, pick(rng, singles), false, 1);
      }
    }

    /* 冠外零星的碎花瓣 */
    var petalSp = makeFaller(rng, { pal: pal, faller: cfg.faller });
    for (var sp = 0; sp < cfg.edge.count; sp++) {
      var a4 = rng() * Math.PI * 2;
      var rr4 = cfg.edge.r0 + rng() * cfg.edge.r1;
      var px3 = crown.x + Math.cos(a4) * crown.rx * rr4;
      var py3 = crown.y + Math.sin(a4) * crown.ry * rr4;
      if (py3 > spec.baseY - 14 || py3 < 6) continue;
      var nj3 = nearestJoint(px3, py3);
      clusters.push({
        joint: nj3,
        ox: Math.round(px3 - joints[nj3].rx),
        oy: Math.round(py3 - joints[nj3].ry),
        sp: petalSp, back: false, edge: 1, state: "on", jitter: rng() * 0.03, tiny: true
      });
    }

    /* 地上的落花：贴着根散开，越远越稀 */
    var gcv = document.createElement("canvas");
    gcv.width = spec.w; gcv.height = spec.h;
    var gctx = gcv.getContext("2d");
    gctx.imageSmoothingEnabled = false;
    for (var s2 = 0; s2 < cfg.ground.petals; s2++) {
      var t2 = (rng() + rng() + rng()) / 3;
      var spread = cfg.ground.spread[0] + rng() * (cfg.ground.spread[1] - cfg.ground.spread[0]);
      var gx = Math.round(spec.baseX + (t2 - 0.5) * spread);
      var gy = spec.baseY + 1 + Math.round(Math.pow(rng(), 1.7) * 8);
      if (gy >= spec.h) continue;
      gctx.fillStyle = pick(rng, pal.soil);
      var gw = rng() < 0.32 ? 2 : 1;
      gctx.fillRect(gx, gy, gw, 1);
    }
    /* 树根压在草地上的一小圈暗影 */
    var shadow = [[44, 0.10], [34, 0.13], [24, 0.16], [14, 0.20]];
    for (var sh = 0; sh < shadow.length; sh++) {
      gctx.fillStyle = "rgba(8,12,20," + shadow[sh][1] + ")";
      gctx.fillRect(Math.round(spec.baseX - shadow[sh][0] / 2), spec.baseY + 1 + sh, shadow[sh][0], 1);
    }

    var scene = mk(scW, scH);
    return {
      cfg: cfg, spec: spec, pal: pal, dark: dark,
      padX: padX, padY: padY, scW: scW, scH: scH,
      joints: joints, clusters: clusters, crown: crown,
      fallers: [makeFaller(rng, { pal: pal, faller: cfg.faller }),
        makeFaller(rng, { pal: pal, faller: cfg.faller }),
        makeFaller(rng, { pal: pal, faller: { shape: "flower", petal: cfg.faller.petal, heart: cfg.faller.heart, soft: cfg.faller.soft } })],
      leafSprites: [makeLeafSprite(rng, false), makeLeafSprite(rng, true)],
      ground: gcv, canvas: scene.cv, ctx: scene.c,
      events: [], leaves: [], blowTimer: 0, ambTimer: 0, recover: 0,
      wind: {
        direction: 1, strength: 0.35, gusts: 0.45, speed: 0, t: 0, manual: false,
        set: function (o) {
          if (o.direction !== undefined) this.direction = o.direction;
          if (o.strength !== undefined) this.strength = o.strength;
          if (o.gusts !== undefined) this.gusts = o.gusts;
        },
        step: function (dt) {
          this.t += dt;
          var swell = Math.sin(this.t * 1.05) * 0.6 + Math.sin(this.t * 2.31 + 1.2) * 0.4;
          var target = this.direction * this.strength * (1 + this.gusts * 0.85 * swell);
          this.speed += (target - this.speed) * Math.min(1, dt * 2.6);
          if (Math.abs(this.speed) < 0.0015) this.speed = 0;
        }
      }
    };
  }

  /* ============================================================
     每帧：摆 → 掉 → 画
     ============================================================ */
  function updatePose(p, t) {
    var wl = p.wind.speed;
    for (var i = 0; i < p.joints.length; i++) {
      var j = p.joints[i];
      var local = 0;
      if (wl !== 0) local += wl * j.bend * (0.85 + 0.4 * Math.sin(t * (1.15 + j.depth * 0.17) + j.phase));
      local += Math.sin(t * 3.2 + j.phase) * 0.006 * Math.abs(wl);
      for (var e = 0; e < p.events.length; e++) {
        var ev = p.events[e], age = t - ev.t0;
        if (age < 0 || age > 2.8) continue;
        var d = Math.sqrt((j.rx - ev.x) * (j.rx - ev.x) + (j.ry - ev.y) * (j.ry - ev.y));
        local += ev.power * Math.exp(-d / 78) * Math.exp(-3.4 * age) * Math.sin(8.6 * age - d * 0.075);
      }
      if (p.drag && p.drag.joint === i) local += p.drag.angle;
      j.rot = (j.parent >= 0 ? p.joints[j.parent].rot : 0) + local;
      var c = Math.cos(j.rot), s = Math.sin(j.rot);
      if (j.parent < 0) {
        j.wx = p.spec.baseX + (j.dx * c - j.dy * s);
        j.wy = p.spec.baseY + (j.dx * s + j.dy * c);
      } else {
        var par = p.joints[j.parent];
        j.wx = par.wx + j.dx * c - j.dy * s;
        j.wy = par.wy + j.dx * s + j.dy * c;
      }
    }
    if (p.events.length) p.events = p.events.filter(function (ev) { return t - ev.t0 < 2.8; });
  }

  function drawClusters(p, back) {
    var ctx = p.ctx;
    for (var i = 0; i < p.clusters.length; i++) {
      var c = p.clusters[i];
      if (c.state !== "on" || !!c.back !== back) continue;
      var j = p.joints[c.joint];
      var co = Math.cos(j.rot), si = Math.sin(j.rot);
      var x = Math.round(j.wx + c.ox * co - c.oy * si);
      var y = Math.round(j.wy + c.ox * si + c.oy * co);
      ctx.drawImage(c.sp.cv, x - c.sp.ox, y - c.sp.oy);
    }
  }

  /* 枝干：按主轴逐行扫描，边是连续的；弯折处补块，基部一路画到地面并微张 */
  function drawWood(p, loLevel, hiLevel) {
    var ctx = p.ctx, bark = p.pal.bark;
    for (var i = 0; i < p.joints.length; i++) {
      var j = p.joints[i];
      if (j.parent < 0) continue;
      if (j.level < loLevel || j.level > hiLevel) continue;
      var q = p.joints[j.parent];
      var dx = j.wx - q.wx, dy = j.wy - q.wy;
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.5) continue;
      var w0 = q.w, w1 = j.w;
      var vert = Math.abs(dy) >= Math.abs(dx);
      var n = Math.max(1, Math.round(vert ? Math.abs(dy) : Math.abs(dx)));
      for (var s = 0; s <= n; s++) {
        var t = s / n;
        var w = Math.max(2, Math.round(w0 + (w1 - w0) * t));
        var half = Math.floor(w / 2);
        if (vert) {
          var x = Math.round(q.wx + dx * t), y = Math.round(q.wy + dy * t);
          ctx.fillStyle = bark[1]; ctx.fillRect(x - half, y, w, 1);
          ctx.fillStyle = bark[2]; ctx.fillRect(x - half, y, 1, 1);
          ctx.fillStyle = bark[0]; ctx.fillRect(x - half + w - 1, y, 1, 1);
        } else {
          var xx = Math.round(q.wx + dx * t), yy = Math.round(q.wy + dy * t);
          ctx.fillStyle = bark[1]; ctx.fillRect(xx, yy - half, 1, w);
          ctx.fillStyle = bark[2]; ctx.fillRect(xx, yy - half, 1, 1);
          ctx.fillStyle = bark[0]; ctx.fillRect(xx, yy - half + w - 1, 1, 1);
        }
      }
      /* 关节补块：缝上折角外侧的缺口 */
      var wk = Math.max(q.w, j.w), hw = Math.floor(wk / 2);
      ctx.fillStyle = bark[1];
      ctx.fillRect(Math.round(j.wx) - hw, Math.round(j.wy) - 1, wk, 3);

      if (q.parent < 0 && q.level === 0) {
        var yTop = Math.round(q.wy), yBot = Math.round(p.spec.baseY) + 2;
        if (yBot > yTop) {
          for (var by = yTop; by <= yBot; by++) {
            var bt = (by - yTop) / (yBot - yTop);
            var bwRow = Math.round(q.w + 1 + bt * 4);
            var bh = Math.floor(bwRow / 2), bx = Math.round(q.wx);
            ctx.fillStyle = bark[1]; ctx.fillRect(bx - bh, by, bwRow, 1);
            ctx.fillStyle = bark[2]; ctx.fillRect(bx - bh, by, 1, 1);
            ctx.fillStyle = bark[0]; ctx.fillRect(bx + bh - 1, by, 1, 1);
          }
        }
      }
    }
  }

  function drawFalling(p) {
    var ctx = p.ctx;
    for (var i = 0; i < p.leaves.length; i++) {
      var l = p.leaves[i];
      var x = Math.round(l.x), y = Math.round(l.y);
      var land = l.land || (p.spec.baseY + 9), fd = l.fade || 18, a = 1;
      if (l.y > land - fd) a = clamp((land - l.y) / fd, 0, 1);
      if (a <= 0) continue;
      if (a < 1) ctx.globalAlpha = a;
      if (l.flip) {
        ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
        ctx.drawImage(l.sp.cv, -l.sp.ox, -l.sp.oy); ctx.restore();
      } else {
        ctx.drawImage(l.sp.cv, x - l.sp.ox, y - l.sp.oy);
      }
      if (a < 1) ctx.globalAlpha = 1;
    }
  }

  function plantX(p, c) {
    var j = p.joints[c.joint];
    var co = Math.cos(j.rot), si = Math.sin(j.rot);
    return { x: j.wx + c.ox * co - c.oy * si, y: j.wy + c.ox * si + c.oy * co };
  }

  function spawnLeaf(p, c) {
    if (p.leaves.length > 210) return;
    var pos = plantX(p, c);
    p.leaves.push({
      sp: p.fallers[Math.floor(Math.random() * p.fallers.length)],
      x: pos.x, y: pos.y,
      vx: p.wind.speed * 34 + (Math.random() - 0.5) * 12,
      vy: 1 + Math.random() * 3,
      ph: Math.random() * 6.28, t: 0, flip: Math.random() < 0.5
    });
  }

  function detach(p, c) {
    if (c.state !== "on") return false;
    c.state = "off";
    c.offAt = performance.now();
    spawnLeaf(p, c);
    return true;
  }

  /* 点一下：局部起一阵，先掉边上的碎花，整团的花球落得少 */
  function shake(p, x, y, t, power) {
    p.events.push({ x: x, y: y, t0: t, power: power === undefined ? 0.046 : power });
    var on = p.clusters.filter(function (c) { return c.state === "on"; });
    if (!on.length) return;
    var scored = on.map(function (c) {
      var pos = plantX(p, c);
      var d = Math.sqrt((pos.x - x) * (pos.x - x) + (pos.y - y) * (pos.y - y));
      var light = c.tiny ? 2.2 : (c.sp.cv.width > 20 ? 0.5 : 1.15);
      return { c: c, k: Math.random() * light * (1 + c.edge * 0.6) / Math.max(9, d) };
    });
    scored.sort(function (a, b) { return b.k - a.k; });
    var n = clamp(Math.round(on.length * 0.012), 2, 4);
    for (var i = 0; i < n && i < scored.length; i++) detach(p, scored[i].c);
  }

  /* 风摘花：只有 manual（用户动过滑杆）才摘，默认只摆不掉 */
  function windDetach(p, dt, t) {
    if (!p.wind.manual) return;
    if (Math.abs(p.wind.speed) < 0.15) return;
    p.blowTimer -= dt;
    if (p.blowTimer > 0) return;
    p.blowTimer = 0.26 + Math.random() * 0.44;
    var on = p.clusters.filter(function (c) { return c.state === "on"; });
    if (!on.length) return;
    var sgn = Math.sign(p.wind.speed);
    for (var i = 0; i < 2; i++) {
      var best = null, bw = -1;
      for (var s = 0; s < 7; s++) {
        var c = on[Math.floor(Math.random() * on.length)];
        if (!c || c.state !== "on") continue;
        var j = p.joints[c.joint];
        var windward = sgn > 0 ? (j.rx + c.ox - p.spec.baseX) / 90 : (p.spec.baseX - (j.rx + c.ox)) / 90;
        var wv = c.edge + Math.random() * 0.5 + windward * 0.5;
        if (wv > bw) { bw = wv; best = c; }
      }
      if (best && Math.random() < 0.18 + 0.42 * Math.abs(p.wind.speed)) detach(p, best);
    }
  }

  function regrow(p, t) {
    var off = p.clusters.filter(function (c) { return c.state !== "on"; });
    off.sort(function (a, b) { return a.joint - b.joint || Math.random() - 0.5; });
    off.forEach(function (c, i) {
      c.state = "pending";
      c.at = t + 0.03 + (i / Math.max(1, off.length)) * 1.6;
    });
  }

  function stepLeaves(p, dt) {
    for (var i = p.leaves.length - 1; i >= 0; i--) {
      var l = p.leaves[i];
      l.t += dt;
      l.vy += (l.g || 22) * dt;
      l.y += l.vy * dt;
      l.x += (l.vx + Math.sin(l.t * 2.4 + l.ph) * (l.sway || (l.amb ? 5 : 7))) * dt;
      l.vx += p.wind.speed * (l.wk || 44) * dt;
      if (l.y > (l.land || (p.spec.baseY + 7)) || l.t > (l.life || 7)) p.leaves.splice(i, 1);
    }
  }

  /* 一直飘着的落花：不摘树上的，自己从树冠里松手；风越大越密 */
  function ambientFall(p, dt) {
    p.ambTimer -= dt;
    if (p.ambTimer > 0) return;
    var w = Math.min(1, Math.abs(p.wind.speed) * 1.1 + Math.abs(p.wind.gusts) * 0.3);
    p.ambTimer = (0.07 + Math.random() * 0.13) * (1 - 0.3 * w);
    if (p.leaves.length > 300) return;
    var cw = p.crown;
    var a = Math.random() * 6.283;
    var rr = 0.35 + Math.sqrt(Math.random()) * 0.65;
    var down = Math.random() < 0.62 ? Math.abs(Math.sin(a)) : Math.sin(a);
    var px = cw.x + Math.cos(a) * cw.rx * rr;
    var py = cw.y + down * cw.ry * 0.9 * rr;
    if (py > p.spec.baseY - 32) py = p.spec.baseY - 32;
    p.leaves.push({
      sp: p.fallers[Math.random() < 0.8 ? 0 : 1],
      x: px, y: py,
      vx: p.wind.speed * 22 + (Math.random() - 0.5) * 5,
      vy: 0.45 + Math.random() * 0.8,
      g: 3.6 + Math.random() * 3.4,
      ph: Math.random() * 6.283, t: 0, life: 10, amb: true,
      flip: Math.random() < 0.5
    });
  }

  /* 掉光之后慢慢补回来 */
  function slowRegrow(p, t, dt) {
    p.recover -= dt;
    if (p.recover > 0) return;
    p.recover = 4.2 + Math.random() * 2.6;
    var gone = null;
    for (var i = 0; i < p.clusters.length; i++) {
      var c = p.clusters[i];
      if (c.state !== "off") continue;
      if (!gone || (c.offAt || 0) < (gone.offAt || 0)) gone = c;
    }
    if (gone) { gone.state = "pending"; gone.at = t + 0.3; }
  }

  function step(p, t, dt) {
    updatePose(p, t);
    if (p.wind.active !== false && p.wind.strength > 0) windDetach(p, dt, t);
    ambientFall(p, dt);
    slowRegrow(p, t, dt);
    for (var i = 0; i < p.clusters.length; i++) {
      var c = p.clusters[i];
      if (c.state === "pending" && t >= c.at) c.state = "on";
    }
    stepLeaves(p, dt);
  }

  function paintPlant(p) {
    var ctx = p.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
    ctx.setTransform(1, 0, 0, 1, p.padX, p.padY);
    ctx.drawImage(p.ground, 0, 0);
    drawWood(p, 3, 99);
    drawClusters(p, true);
    drawWood(p, 0, 2);
    drawClusters(p, false);
    drawFalling(p);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ============================================================
     布景：渐变灰 + 四角压暗 + 树后光 + 落地影
     ============================================================ */
  var BG = {
    light: { solid: "#E4E9F3", solidLit: "#F4F6FC", solidDeep: "#D3DBE8", solidShadow: "#AEBBD2" },
    dark: { solid: "#26282C", solidLit: "#2D2F34", solidDeep: "#1E2023", solidShadow: "#15171A" }
  };

  function drawFloor(ctx, bw, bh, bg, ax, ay) {
    var g = ctx.createLinearGradient(0, 0, 0, bh);
    g.addColorStop(0, bg.solidLit);
    g.addColorStop(0.40, bg.solid);
    g.addColorStop(1, bg.solidDeep);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, bw, bh);

    var vig = ctx.createRadialGradient(bw * 0.5, bh * 0.46, bw * 0.18, bw * 0.5, bh * 0.46, bw * 0.86);
    vig.addColorStop(0, "rgba(23,33,54,0)");
    vig.addColorStop(0.62, "rgba(23,33,54,0)");
    vig.addColorStop(1, "rgba(23,33,54,.055)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, bw, bh);

    var halo = ctx.createRadialGradient(ax, ay - bh * 0.30, 0, ax, ay - bh * 0.30, bw * 0.33);
    halo.addColorStop(0, "rgba(255,255,255,.10)");
    halo.addColorStop(0.52, "rgba(255,255,255,.042)");
    halo.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, bw, bh);

    var rx = bw * 0.17, ry = bh * 0.026;
    for (var i = 0; i < 8; i++) {
      var f = 1 - i / 8;
      ctx.globalAlpha = 0.055;
      ctx.fillStyle = bg.solidShadow;
      ctx.beginPath();
      ctx.ellipse(ax, ay + 1, Math.round(rx * f + 9), Math.round(ry * f + 2.5), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.20;
    ctx.beginPath();
    ctx.ellipse(ax, ay + 1, Math.round(rx * 0.30), Math.round(ry * 0.55 + 2), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* ============================================================
     mount：给一个容器，自己管 DPR、整数倍缩放、背景、rAF
     ============================================================ */
  function mount(host, opts) {
    opts = opts || {};
    var dark = !!opts.dark;
    var plant = opts.plant || build(opts.plant || opts.name || "pear", { dark: dark });
    var bgMode = opts.bg || "solid";
    var bg = BG[dark ? "dark" : "light"];

    var backCv = document.createElement("canvas");
    backCv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated";
    var sceneCv = document.createElement("canvas");
    sceneCv.style.cssText = "position:absolute;image-rendering:pixelated;left:0;top:0";
    /* 只在容器是 static 时才改定位，别覆盖调用方自己的 fixed/absolute */
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.appendChild(backCv);
    host.appendChild(sceneCv);

    var backCtx = backCv.getContext("2d"), sceneCtx = sceneCv.getContext("2d");
    var scale = 1, sLeft = 0, sTop = 0;

    function dpr() { return Math.min(3, Math.max(1, opts.dpr || window.devicePixelRatio || 1)); }

    /* 容器可能还没参与布局（比如刚挂上 DOM），量不到尺寸就退回视口 */
    function box() {
      var w = host.clientWidth, h = host.clientHeight;
      if (w < 120 || h < 120) { w = window.innerWidth; h = window.innerHeight; }
      return { w: w, h: h };
    }

    function layout() {
      var d = dpr();
      var s = box();
      var w = s.w, h = s.h;
      var k = Math.floor(Math.min(Math.max(120, w - 24) * d / plant.scW,
        Math.max(120, h - 28) * d / plant.scH));
      k = Math.max(1, Math.min(k, Math.ceil(4 * d)));
      scale = k;
      sceneCv.width = plant.scW * k;
      sceneCv.height = plant.scH * k;
      sceneCv.style.width = (sceneCv.width / d) + "px";
      sceneCv.style.height = (sceneCv.height / d) + "px";
      sLeft = Math.round((w - sceneCv.width / d) / 2);
      sTop = Math.round(Math.max(6, (h - sceneCv.height / d) / 2 - 6));
      sceneCv.style.left = sLeft + "px";
      sceneCv.style.top = sTop + "px";
      paintBack();
      paintScene();
    }

    function paintBack() {
      if (bgMode === "none") return;
      var d = dpr();
      var s = box();
      var cs = Math.max(1, scale / d);
      var bw = Math.max(64, Math.round(s.w / cs));
      var bh = Math.max(48, Math.round(s.h / cs));
      var ax = Math.round((sLeft / cs) + (plant.padX + plant.spec.baseX));
      var ay = Math.round((sTop / cs) + (plant.padY + plant.spec.baseY));
      backCv.width = bw; backCv.height = bh;
      backCtx.setTransform(1, 0, 0, 1, 0, 0);
      backCtx.clearRect(0, 0, bw, bh);
      drawFloor(backCtx, bw, bh, bg, ax, ay);
    }

    function paintScene() {
      sceneCtx.setTransform(1, 0, 0, 1, 0, 0);
      sceneCtx.imageSmoothingEnabled = false;
      sceneCtx.clearRect(0, 0, sceneCv.width, sceneCv.height);
      sceneCtx.drawImage(plant.canvas, 0, 0, plant.scW * scale, plant.scH * scale);
    }

    var raf = 0, last = 0;
    function frame(now) {
      var t = now / 1000;
      if (!last) last = t;
      var dt = Math.min(0.034, Math.max(0.001, t - last));
      last = t;
      plant.wind.step(dt);
      step(plant, t, dt);
      paintPlant(plant);
      paintScene();
      raf = requestAnimationFrame(frame);
    }

    layout();
    plant.wind.set({ direction: 1, strength: opts.strength === undefined ? 1 : opts.strength,
      gusts: opts.gusts === undefined ? 0.85 : opts.gusts });
    /* 预铺几片在飘的落花，开场就不空 */
    for (var i = 0; i < 16; i++) ambientFall(plant, 0);
    paintPlant(plant);
    raf = requestAnimationFrame(frame);

    var onResize = function () { layout(); };
    window.addEventListener("resize", onResize);
    /* 容器尺寸变了（比如刚挂上 DOM、或者被别的布局挤动）也跟着重排 */
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { layout(); });
      ro.observe(host);
    }

    return {
      plant: plant,
      canvas: sceneCv,
      redraw: function () { paintPlant(plant); paintScene(); },
      relayout: layout,
      stop: function () {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        if (ro) ro.disconnect();
      },
      shake: function (x, y) { shake(plant, x, y, performance.now() / 1000, 0.046); },
      regrowAll: function () { regrow(plant, performance.now() / 1000); }
    };
  }

  /* ============================================================
     几种植物的参数（改这些就能换树种，不用动代码）
     ============================================================ */
  var PRESETS = {
    /* 梨：主干直、枝上扬、冠竖椭圆上窄下宽、白花 */
    pear: {
      palette: "pear",
      spec: { name: "梨花", seed: 20261 },
      trunk: { height: 140, segs: 12, wBase: 11.5, lean: -0.006, wob: 0.3 },
      branches: [[0.58, 1.06, 50], [0.70, 0.92, 46], [0.80, 0.66, 42], [0.88, 0.38, 36], [0.95, 0.18, 30]],
      crown: { dy: -158, rx: 98, ry: 84, shape: "pear", squash: 0.26 },
      ball: { stamp: "blossom", petal: "#FFFFFF", inner: "#F8E4EA", cast: "#F4D8E1" },
      single: { petal: "#FFFFFF" },
      faller: { shape: "petal", petal: "#F4DFE6", soft: "#DEBEC9" }
    },
    /* 桃：树矮一点、冠更圆更宽、枝更外张、粉更暖 */
    peach: {
      palette: "peach",
      spec: { name: "桃花", seed: 70213, baseY: 276 },
      trunk: { height: 118, segs: 11, wBase: 10.5, lean: -0.02, wob: 0.42 },
      branches: [[0.52, 1.18, 58], [0.64, 1.04, 54], [0.76, 0.82, 48], [0.86, 0.52, 40], [0.94, 0.24, 32]],
      crown: { dy: -134, rx: 106, ry: 88, shape: "round" },
      balls: { count: 88, rMin: 13, rMax: 18, gap: 9 },
      ball: { stamp: "blossom", petal: "#FFEFF4", inner: "#F7C9D6", cast: "#F2B6C8", heartA: "#C4557A", heartB: "#E8B24E" },
      single: { petal: "#FFF2F6", inner: "#F6C6D4" },
      blooms: { count: 120 },
      ground: { petals: 84, spread: [56, 180] },
      faller: { shape: "petal", petal: "#F0C6D4", soft: "#DCA0B4", heart: "#C4557A" }
    },
    /* 樱：主干短、冠低而宽、下垂多、粉极浅 —— 和桃（高干圆冠）拉开区别 */
    cherry: {
      palette: "cherry",
      spec: { name: "樱花", seed: 30451, baseY: 274 },
      trunk: { height: 96, segs: 10, wBase: 9.5, lean: 0.05, wob: 0.55 },
      branches: [[0.30, 1.36, 62], [0.42, 1.22, 60], [0.55, 1.06, 56],
        [0.68, 0.88, 50], [0.80, 0.62, 42], [0.90, 0.34, 32]],
      crown: { dy: -108, rx: 116, ry: 92, shape: "round" },
      balls: { count: 104, rMin: 11, rMax: 17, gap: 8, botPad: 30 },
      ball: { stamp: "blossom", petal: "#FFF6FA", inner: "#F8DCE8", cast: "#F3CBDD", heartA: "#D27793", heartB: "#E9C36E", density: 1.05 },
      single: { petal: "#FFF8FB", inner: "#F7D6E4" },
      blooms: { count: 170, spread: 1.1 },
      droop: { count: 56, span: 0.8, y0: 0.72, y1: 0.32 },
      ground: { petals: 96, spread: [60, 190] },
      faller: { shape: "petal", petal: "#F7DCE8", soft: "#E4B3C6", heart: "#CF7590" }
    },
    /* 银杏：干高直、冠是上尖下宽的锥、叶是扇形金片，球少而散，枝要露出来 */
    ginkgo: {
      palette: "ginkgo",
      spec: { name: "银杏", seed: 88107, baseY: 276 },
      trunk: { height: 168, segs: 15, wBase: 10.5, lean: 0, wob: 0.18 },
      branches: [[0.40, 1.02, 44], [0.50, 0.92, 44], [0.60, 0.80, 44], [0.70, 0.66, 42],
        [0.79, 0.52, 38], [0.87, 0.38, 32], [0.93, 0.24, 26], [0.97, 0.10, 20]],
      branch: { forks: 2, twigLen: [18, 26], forkAng: [0.2, 0.34], tipLen: [12, 18] },
      crown: { dy: -132, rx: 88, ry: 100, shape: "cone" },
      balls: { count: 82, rMin: 10, rMax: 16, gap: 7, botPad: 44, toneSlope: 1.6 },
      inner: { count: 18, rMin: 8, rMax: 13 },
      ball: { stamp: "fan", petal: "#F9E39C", inner: "#F3CB62", cast: "#E7B04A", heartA: "#C88A2E", heartB: "#D9A23C", density: 0.72 },
      single: { stamp: "fan", petal: "#FBE6A5", inner: "#F2C75A", heartA: "#C88A2E", heartB: "#E0AC48", count: 6 },
      blooms: { count: 120, spread: 0.96 },
      droop: { count: 10, span: 0.6, y0: 0.8, y1: 0.24 },
      ground: { petals: 110, spread: [54, 170] },
      faller: { shape: "fan", petal: "#F6D477", soft: "#D9A23C", heart: "#C88A2E" }
    },
    /* 灌木：没有主干，从地面直接起枝；冠扁而宽，贴着地面长 */
    bush: {
      palette: "bush",
      spec: { name: "灌木", seed: 55123, w: 220, h: 140, baseX: 110, baseY: 124, padX: 34, padY: 10 },
      trunk: { height: 8, segs: 3, wBase: 4.5, lean: 0, wob: 0.06, taper: 0.2, segW: 3 },
      branches: [[0.10, 1.35, 20], [0.20, 1.15, 24], [0.32, 0.95, 26], [0.46, 0.75, 26],
        [0.60, 0.55, 24], [0.74, 0.36, 20], [0.86, 0.18, 15], [0.95, 0.04, 10]],
      branch: { wFactor: 0.4, forks: 2, twigLen: [10, 14], forkAng: [0.3, 0.55],
        tipLen: [6, 10], tipProb: 0.92, twigCurve: 0.12, tipCurve: 0.1 },
      crown: { dy: -40, rx: 66, ry: 42, shape: "bush" },
      balls: { count: 60, rMin: 9, rMax: 15, gap: 6, topPad: 3, botPad: 3, toneBase: 0.4, toneSlope: 1.1 },
      inner: { count: 20, rMin: 7, rMax: 11 },
      blooms: { count: 44, spread: 0.98 },
      droop: { count: 12, span: 0.85 },
      tips: { perJoint: 2, levelMin: 1, r: 5 },
      edge: { count: 14, r0: 1.0, r1: 0.14 },
      ground: { petals: 26, spread: [26, 90] },
      ball: { stamp: "leaflet", density: 1.0, petal: "#A9C49E", inner: "#8FAC85", cast: "#C6D9BB", heartA: "#6E8B63", heartB: "#8FAC85" },
      single: { stamp: "leaflet", petal: "#B8D2A8", inner: "#8FAC85", heartA: "#6E8B63", heartB: "#7F9C72", count: 3 },
      faller: { shape: "petal", petal: "#A9C49E", soft: "#7F9C72", heart: "#5F7C55" }
    },
    /* 松：干高直、冠瘦高呈锥、枝短而平展分层，墨绿针叶碎、团间露枝 */
    pine: {
      palette: "pine",
      spec: { name: "松树", seed: 66321, baseY: 278, padX: 60, padY: 14 },
      trunk: { height: 190, segs: 16, wBase: 11.5, lean: 0, wob: 0.2, taper: 0.7 },
      branches: [[0.30, 1.00, 40], [0.42, 0.90, 38], [0.54, 0.80, 36], [0.66, 0.70, 34],
        [0.78, 0.60, 30], [0.88, 0.50, 26], [0.96, 0.38, 22]],
      branch: { wFactor: 0.42, forks: 2, twigLen: [16, 24], forkAng: [0.18, 0.34],
        tipLen: [10, 16], tipProb: 0.8, tipBend: 0.016 },
      crown: { dy: -132, rx: 74, ry: 120, shape: "cone" },
      balls: { count: 130, rMin: 7, rMax: 11, gap: 6, topPad: 8, botPad: 40, toneBase: 0.55, toneSlope: 1.6 },
      inner: { count: 30, rMin: 7, rMax: 10 },
      blooms: { count: 110, spread: 0.84 },
      tips: { perJoint: 1, levelMin: 2, r: 4 },
      edge: { count: 6, r0: 1.0, r1: 0.1 },
      ground: { petals: 14, spread: [40, 120] },
      ball: { stamp: "needles", density: 1.0, petal: "#1E5A34", inner: "#3C9A58", cast: "#123A24", heartA: "#5DBB75", heartB: "#27633B" },
      single: { stamp: "needles", petal: "#246B3C", inner: "#3C9A58", heartA: "#5DBB75", heartB: "#2C7D48", count: 5 },
      faller: { shape: "petal", petal: "#2C7D48", soft: "#17432A", heart: "#3C9A58" }
    }
  };

  /* ---------- 对外 ---------- */
  var PF = {
    build: function (nameOrCfg, opts) { return build(nameOrCfg, opts); },
    mount: mount,
    step: step,
    paint: paintPlant,
    shake: shake,
    regrow: regrow,
    presets: PRESETS,
    palettes: PALETTES,
    bg: BG,
    drawFloor: drawFloor,
    version: "1.0"
  };
  global.PF = PF;
})(window);
