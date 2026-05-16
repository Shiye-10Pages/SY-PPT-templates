# Template Designer Skill

> 触发词：`设计新主题` / `new theme` / `template designer`

基于 zarazhangrui/beautiful-html-templates 34 个模板的**审美 DNA 数据库**，为 SY-PPT-templates 设计一个新主题，输出：

1. **Claude.ai Artifacts 提示词**（粘入 Claude.ai 得到 3 屏可视化预览）
2. **theme.css + meta.ts + example.md**（直接写入 src/themes/）
3. **blank-deck.html**（agent 起点文件）
4. **5 张 Playwright 截图**（用于 README）

---

## STEP 1 — 载入 DNA 数据库

读取 `scripts/bt-dna-database.json`。若文件不存在，先运行：
```bash
node scripts/analyze-bt-templates.mjs
```

---

## STEP 2 — 设计问卷

用 **AskUserQuestion** 工具一次性问 3 个问题：

**Q1 — 场景**（6 选 1）
- 创意工作室 / 个人品牌 / 内容创作者
- 数据驱动 / 商业分析 / 季度汇报
- 品牌发布 / 产品 Pitch / 创始人演讲
- 学术研究 / 白皮书 / 深度报告
- 中国政务 / 国企 / B 端汇报
- 其他（用户自定义描述）

**Q2 — 调性**（4 选 1）
- 自信打眼 · 图形感强（mood: confident, punchy, bold, graphic）
- 温暖编辑 · 排版主导（mood: warm, editorial, literary, considered）
- 深暗戏剧 · 权威感（mood: moody, dark, institutional, dramatic）
- 活泼触感 · 手工感（mood: playful, crafted, warm, tactile）

**Q3 — 默认比例**（5 选 1）：16:9 / 4:5 / 3:4 / 9:16 / 2.35:1

---

## STEP 3 — DNA 匹配算法

从 `bt-dna-database.json` 中：

```
1. 调性映射 → 目标 mood 关键词（2-3 个）
   - 自信打眼  → ["confident","punchy","bold","graphic","editorial"]
   - 温暖编辑  → ["warm","editorial","literary","considered","quiet"]
   - 深暗戏剧  → ["dark","moody","institutional","dramatic","nocturnal"]
   - 活泼触感  → ["playful","warm","crafted","tactile","fun"]

2. 过滤：模板的 mood[] 与目标关键词有 ≥ 2 个交集

3. 从剩余候选中选 3 个：
   A. 「最佳匹配」— mood 匹配数最多
   B. 「技术借鉴」— 有某个独特 signature_element（别的候选没有的）
   C. 「野牌参考」— mood 略有偏差但有一个特技值得学

4. 对每个参考模板，标注「借鉴什么」：
   - 颜色系统结构（几色，对比度策略）
   - 字体碰撞方式（serif ✕ sans ？mono ？）
   - 1-2 个 signature_element（装饰词汇）
   - 布局密度
```

---

## STEP 4 — 生成 Claude.ai Artifacts 提示词

基于 STEP 3 的匹配结果，合成以下提示词。这是 Skill 的**核心输出**，直接粘入 claude.ai 的对话框。

```
================== 📋 Claude.ai 设计提示词（复制以下全部内容）==================

你是一位专业的 HTML/CSS 演示文稿设计师。
根据以下设计系统，创建一个**完整可交互的 3 屏迷你幻灯片预览**，
输出为**单文件 HTML Artifact**，可在浏览器直接打开。

─────────────────────────────────────────────────────

## 主题身份

**英文名：** [生成 slug，如 "signal-noir"]  
**中文名：** [2-4 字，如 "深夜报告"]  
**一句话：** [精炼的视觉定位句]  
**定位：** [场景] · [调性] · [比例] slide deck

─────────────────────────────────────────────────────

## 颜色系统（严格遵守，4 色）

| 角色 | 色值 | 用途 |
|------|------|------|
| 背景 | #XXXXXX | 所有 slide 底色 |
| 正文 | #XXXXXX | 标题、正文 |
| 主调 | #XXXXXX | 数字、accent rule、高亮 |
| 辅调 | #XXXXXX | 次级 accent、图标、小标 |

从参考模板 [A] 借鉴：[颜色对比策略描述]

─────────────────────────────────────────────────────

## 字体系统

Display（标题/大字）：[字体名] · weight [N] · tracking [em]  
Body（正文/引语）：[字体名] · [italic? weight?]  
Google Fonts：
```html
<link href="https://fonts.googleapis.com/css2?family=[Font+Name]:wght@400;600;800&display=swap" rel="stylesheet">
```

字体碰撞策略：[描述，如「Bricolage 重磅无衬线 ✕ Instrument Serif 斜体——机械与温度的对话」]

─────────────────────────────────────────────────────

## 签名视觉元素（从参考模板提炼，至少 3 个）

**元素 1：** [名称]
```css
/* [描述] */
[具体 CSS 代码，可直接用]
```

**元素 2：** [名称]
```css
[具体 CSS 代码]
```

**元素 3：** [名称]
```css
[具体 CSS 代码]
```

─────────────────────────────────────────────────────

## 3 屏预览规格

### 第 1 屏 — 封面（Cover）
- 展示完整标题系统和装饰词汇
- 包含：大字标题 + 副标题 + 至少 2 个签名装饰元素
- 内容：[生成与场景匹配的中文标题]

### 第 2 屏 — 数据/内容屏（最能展示设计力的屏）
- 展示：[list 或 stats 或 compare，根据场景选]
- 内容：[生成真实感的中文数据内容]

### 第 3 屏 — 引语/结尾（展示字体碰撞）
- 展示：大字引语 + 署名行
- 字体：Display 用大字，Body 用 italic
- 内容：[生成有力量的中文引语]

─────────────────────────────────────────────────────

## 技术规格

- Viewport：[W]×[H]px（基于比例 [ratio]）
- Auto-scale：`transform: scale(min(100vw/[W], 100vh/[H]))` 自动缩放
- 键盘导航：← → 翻页，空格键翻下一屏
- CSS container queries（cqi）驱动字号
- 所有 slide 用 `position:absolute; inset:0` 堆叠，`opacity` 切换

## 质量标准

- 每屏必须有明显不同的空间结构（不是同一布局的重复）
- 颜色系统严格只用上面定义的 4 色（+透明度变体）
- 中文文字必须正确渲染，行高 ≥ 1.4
- 签名视觉元素至少在 2 屏中出现
- 整体「一眼觉得是设计了的」

## 参考标杆

- 主参考：[slug-A]（[tagline]）— 借鉴 [X]
- 技术参考：[slug-B]（[tagline]）— 借鉴 [Y]  
- 反参考（不要做成这样）：[avoid 描述]

================== 📋 提示词结束 ==================
```

---

## STEP 5 — 直接生成主题文件

**不等用户粘入 Claude.ai**，同步生成实际文件到仓库。

### theme.css
```
路径：src/themes/[slug]/theme.css

内容模板：
[data-theme="[slug]"] {
  --bg:           [bg色值];
  --bg-grad-from: [bg色值];
  --bg-grad-to:   [比bg稍深的变体，用color-mix计算];
  --fg:           [fg色值];
  --fg-muted:     rgba([fg-rgb], 0.52);
  --accent:       [accent_1];
  --accent-2:     [accent_2 或 accent_1 的变体];
  --accent-glow-1: rgba([accent_1-rgb], 0.15);
  --accent-glow-2: rgba([accent_1-rgb], 0.08);

  --display-font:     "[display_family]", "PingFang SC", "Hiragino Sans GB", system-ui, sans-serif;
  --body-font:        "[body_family]", "Source Han Serif SC", Georgia, serif;
  --display-weight:   [max_weight];
  --display-tracking: [tracking];

  --slide-radius:  0px;
  --slide-padding: 8vw;

  /* FX 选项（根据调性决定） */
  --fx-accent-rule: [0或1];
  --fx-mouse-glow:  [0或1];
  --fx-hover-lift:  [0或1];
}

/* 签名视觉元素的 CSS 实现 */
[具体 CSS 代码，从 STEP 4 的签名元素里提取]
```

### meta.ts
```typescript
路径：src/themes/[slug]/meta.ts

import type { ThemeMeta } from '../types'
export const meta: ThemeMeta = {
  id: '[slug]',
  name: '[中文名]',
  scene: '[场景描述]',
  locale: 'cn' | 'global',   // 根据场景判断
  tier: 'A'|'B'|'C'|'D',
  description: '[一句话描述，体现字体/颜色/质感]',
  swatch: ['[bg]', '[accent_1]', '[accent_2]', '[fg]'],
  exampleFile: '[slug]',
  defaultAspect: '[ratio]',
}
```

### example.md
根据场景生成 8-10 屏示例，必须涵盖：
- cover
- @chapter（如果是演讲场景）
- quote（体现字体碰撞）
- bigNumber（体现大数字风格）
- list 或 @stats 或 @compare（根据场景）
- @chart（如果是数据场景）
- 收尾屏

---

## STEP 6 — 生成 blank-deck.html

```bash
pnpm blank-decks
```

脚本自动为所有主题（包括新增的）生成 blank-deck.html。

---

## STEP 7 — Playwright 截图（5 张）

用 `scripts/generate-screenshots.mjs` 模式，为新主题在 `scripts/generate-screenshots.mjs` 的 `FEATURED` 数组里加一条，或直接用以下代码截图：

```javascript
// 新主题截图 — 加入到现有截图脚本的 FEATURED 数组
{ id: '[slug]', pick: [0, 2, 4] }  // cover + 中段特色屏 + 结尾
```

运行 `pnpm screenshots` 生成 `screenshots/[slug]-{1,2,3}.png`。

---

## STEP 8 — 更新 index.json

```bash
pnpm build-index
```

---

## 质量检查清单（Skill 执行完后自检）

- [ ] `pnpm build` 通过（无 TypeScript 错误）
- [ ] `pnpm lint` 通过
- [ ] `src/themes/[slug]/blank-deck.html` 存在
- [ ] `screenshots/[slug]-{1,2,3}.png` 存在
- [ ] `index.json` 中有新主题条目（palette + typography + slide_types 字段完整）
- [ ] Claude.ai 提示词已完整输出（用户可以直接复制粘贴）

---

## DNA 数据库快查（用于匹配时参考）

调性 → 高频匹配模板：

| 调性 | 最佳参考模板 | 签名技术 |
|---|---|---|
| 自信打眼·图形感 | neo-grid-bold, raw-grid, studio, peoples-platform | offset-shadow, 900w display, full-bleed color slides |
| 温暖编辑·排版主导 | editorial-tri-tone, soft-editorial, biennale-yellow, grove | serif-sans collision, italic body, atmospheric glow |
| 深暗戏剧·权威感 | signal, monochrome, vellum, pink-script | vw scale, serif display, large rounded cards |
| 活泼触感·手工感 | capsule, scatterbrain, daisy-days, sakura-chroma | grain texture, floating elements, SVG ornaments |
| 复古/特色 | retro-windows, retro-zine, 8-bit-orbit, sakura-chroma | clip-path, continuous-animation, ultra-heavy type |
