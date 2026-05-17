<div align="center">

# 十页 Deck · SY-PPT-templates

**一段 Markdown → 一个可分享的 PPT**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Templates](https://img.shields.io/badge/主题-26个-orange)](src/themes)
[![DSL Types](https://img.shields.io/badge/DSL类型-22种-green)](AGENTS.md)
[![Agent Ready](https://img.shields.io/badge/AI_Agent-开箱即用-purple)](AGENTS.md)

[🇨🇳 中文](README.md) · [🇺🇸 English](README.en.md)

---

**粘贴 Markdown → 选主题 → 导出 HTML，双击即可分享**

无账号 · 无水印 · 无云端 · 全开源

</div>

---

## 这是什么？

你写内容，它负责「让内容好看」。

把一段普通的 Markdown 文字，变成两种东西：

| 产物 | 是什么 | 怎么用 |
|---|---|---|
| 📄 **长页 HTML** | 一个 `.html` 文件，键盘翻页，有动画 | 发给别人，双击就能看；或直接投影 |
| 🖼️ **分享卡片 ZIP** | 每屏一张 PNG，共 N 张 | 发小红书 / 朋友圈 / 视频号 |

**没有云端，没有订阅，装一次用到死。**

---

## 两种使用方式

### 方式一：浏览器编辑器（适合自己动手）

```bash
# 需要 Node.js + pnpm（只需安装一次）
pnpm install
pnpm dev
```

打开 `http://localhost:5173`：

```
┌─────────────────────────────────────┐
│  左侧：粘贴你的 Markdown 内容        │
│  右侧：实时预览效果                  │
│  右上角：选主题 / 切比例 / 导出       │
└─────────────────────────────────────┘
```

1. 把你的文章 / 想法粘贴到左侧
2. 右上角选一个主题（26 个可选）
3. 点「下载 HTML」→ 发给任何人，双击就能打开

### 方式二：AI Agent 直接生成（适合懒人 / 非技术用户）

**不需要装任何东西。** 把下面这句话粘给你的 AI 工具（Claude Code / Cursor / Cline 等）：

> 帮我做一份 PPT。
> 克隆 https://github.com/Shiye-10Pages/SY-PPT-templates，
> 按照里面 AGENTS.md 的步骤，从 index.json 挑一个最合适的模板，
> 根据我的内容生成一个可以双击打开的 HTML 文件。

AI 会自动：
- 读操作手册 → 选最合适的主题 → 帮你写内容 → 生成 HTML → 发给你文件路径

---

## 效果展示

### 🌑 脉冲霓虹 · Neon Pulse（科技发布 · 16:9）

<img src="screenshots/neon-pulse-1.png" width="32%" /> <img src="screenshots/neon-pulse-2.png" width="32%" /> <img src="screenshots/neon-pulse-3.png" width="32%" />

### ☀️ 太阳爆破 · Solar Blast（品牌宣言 · 4:5）

<img src="screenshots/solar-blast-1.png" width="32%" /> <img src="screenshots/solar-blast-2.png" width="32%" /> <img src="screenshots/solar-blast-3.png" width="32%" />

### 🎨 色彩爆破 · Chroma Pop（创意 Pitch · 4:5）

<img src="screenshots/chroma-pop-1.png" width="32%" /> <img src="screenshots/chroma-pop-2.png" width="32%" /> <img src="screenshots/chroma-pop-3.png" width="32%" />

### 📒 编辑暖色 · Editorial Warm（个人品牌 · 4:5）

<img src="screenshots/editorial-warm-1.png" width="32%" /> <img src="screenshots/editorial-warm-2.png" width="32%" /> <img src="screenshots/editorial-warm-3.png" width="32%" />

### 🏛️ 深度汇报 · Deep Authority（季度汇报 · 16:9）

<img src="screenshots/deep-authority-1.png" width="32%" /> <img src="screenshots/deep-authority-2.png" width="32%" /> <img src="screenshots/deep-authority-3.png" width="32%" />

### 🔴 政务汇报红 · Government Red（党建/政务 · 16:9）

<img src="screenshots/govt-red-1.png" width="32%" /> <img src="screenshots/govt-red-2.png" width="32%" /> <img src="screenshots/govt-red-3.png" width="32%" />

### 🍜 餐饮促销 · Restaurant Promo（门店/朋友圈 · 4:5）

<img src="screenshots/restaurant-promo-1.png" width="32%" /> <img src="screenshots/restaurant-promo-2.png" width="32%" /> <img src="screenshots/restaurant-promo-3.png" width="32%" />

### 🌸 小红书种草 · Xiaohongshu Pastel（小红书 · 3:4）

<img src="screenshots/xhs-pastel-1.png" width="32%" /> <img src="screenshots/xhs-pastel-2.png" width="32%" /> <img src="screenshots/xhs-pastel-3.png" width="32%" />

### 📚 读书金句 · Book Quote（阅读分享 · 4:5）

<img src="screenshots/book-quote-1.png" width="32%" /> <img src="screenshots/book-quote-2.png" width="32%" /> <img src="screenshots/book-quote-3.png" width="32%" />

### 🖤 Keynote · 发布会（产品发布 · 16:9）

<img src="screenshots/keynote-dark-1.png" width="32%" /> <img src="screenshots/keynote-dark-2.png" width="32%" /> <img src="screenshots/keynote-dark-3.png" width="32%" />

---

## 全部 26 个主题

<details>
<summary>📋 点击展开完整列表</summary>

### Tier A — 中国 B 端实用（8 个）

| 主题 | 适合场景 | 尺寸 | 特色 |
|---|---|---|---|
| 🔴 政务汇报红 | 党建 / 政府机关 / 事业单位 | 16:9 | 国旗红 + 宋体，正式权威 |
| 🔵 国企蓝白 | 央企 / 上市公司 / 年报 | 16:9 | 海军蓝 + 暗金，年报感 |
| 🍊 餐饮促销 | 门店周年 / 节日活动 / 朋友圈 | 4:5 | 烟火红 + 蛋黄，热闹 |
| 🧡 教培招生 | K12 / 培训机构 / 课程 | 4:5 | 暖橙 + 信任蓝，家长友好 |
| 🏙️ 房产销售 | 楼盘 / 户型 / 急售 | 4:5 | 深灰蓝 + 暗金，高端 |
| 💚 保险/理财 | 保险代理 / 理财顾问 | 4:5 | 深青绿 + 金，信任感 |
| ⚙️ 制造业汇报 | 工厂月报 / 工艺 / 安全 | 16:9 | 石墨灰 + 工程橙 |
| 🔑 党建党课 | 党课 / 主题教育 / 三会一课 | 16:9 | 党徽红 + 金，肃穆 |

### Tier B — 中国 C 端内容创作（6 个）

| 主题 | 适合场景 | 尺寸 | 特色 |
|---|---|---|---|
| 🌸 小红书种草 | 测评 / 攻略 / 好物 | 3:4 | 樱花粉 + 葡萄紫，种草感 |
| 🎬 抖音直播预告 | 直播预热 / 视频号 | 9:16 | 抖音红 + 青，故障感 |
| 💬 公众号头图 | 文章封面 / 横版分享 | 2.35:1 | 微信绿 + 白，标题党友好 |
| 📱 朋友圈分享 | 年终总结 / 长图 | 4:5 | 白底 + 微信绿，苹果系统感 |
| 📖 读书金句 | 阅读分享 / 笔记 | 4:5 | 牛皮纸 + 深褐衬线，书卷气 |
| 🔬 知识科普 | 冷知识 / 科普卡片 | 4:5 | 米白 + 知识蓝，权威感 |

### Tier C — 通用专业（8 个）

| 主题 | 适合场景 | 尺寸 | 特色 |
|---|---|---|---|
| 🚀 一人公司 Pitch | 创业 BP / 独立开发者 | 16:9 | 纯黑 + 白，极简硬核 |
| 📋 个人简历/作品集 | 求职 / 接单 | 4:5 | 米白 + 衬线，专业克制 |
| 📝 会议纪要 | 团队周会 / 决议 | 16:9 | 白底红重点，效率优先 |
| 📊 数据仪表板 | KPI 看板 / QBR | 16:9 | 深色 + 青绿，数字至上 |
| ✏️ 编辑暖色 | 创意工作室 / 年度回顾 | 4:5 | 羊皮纸 + 砖红，杂志质感 |
| 💥 色彩爆破 | 品牌重塑 / 创意 Pitch | 4:5 | 纯白 + 电蓝橙，neo-brutalist |
| 🏛️ 深度汇报 | 季报 / 投资人 / 董事会 | 16:9 | 深海军 + 温暖金，权威质感 |
| 🌺 太阳爆破 | 品牌宣言 / 活动海报 | 4:5 | 奶油 + 电黄 + 极红，海报能量 |

### Tier D — 国际化经典（2 个）

| 主题 | 适合场景 | 尺寸 | 特色 |
|---|---|---|---|
| 🍎 Keynote 发布会 | 产品发布 / 大屏演讲 | 16:9 | 黑底 + indigo，Apple 风 |
| 🇨🇭 Swiss 瑞士极简 | 编辑设计 / 高端汇报 | 16:9 | 米纸 + 红线条，极简权威 |

### 脉冲霓虹 · Neon Pulse（Tier D 新增）

| 主题 | 适合场景 | 尺寸 | 特色 |
|---|---|---|---|
| ⚡ 脉冲霓虹 | 科技发布 / 黑客松 / 独立开发 | 16:9 | 纯黑 + 电气薄荷 + 热珊瑚 |

</details>

---

## 怎么写 PPT？（Markdown 语法速查）

不需要学太多，记住几个符号就够了：

```markdown
# 封面大标题
副标题写在第二行

---

## 正文区块标题
# 这行是「大字占满整屏」的用法

---

> 90%
下面这行是大数字屏的注解

---

> 这是一段引语，加双引号感觉
作者署名

---

## 列表标题
- 要点一
- 要点二
- 要点三

---

## 价格卡（餐饮/教培/房产用）
¥ 38 / 位
~~原价 98~~
限时三天

---

## 联系方式
📞 138-0013-8000
💬 微信: your-account
📍 北京市朝阳区

---

@qr
扫码联系我
店铺名 · 分店名

---

@chapter
## 第二章
章节分隔大屏

---

@stats
## 核心指标
- 340% / 用户增长 / 环比上季度
- 98.2% / 系统可用率 / SLA 承诺

---

@compare
## 我们 vs 竞品
||| 竞品
- 需要安装客户端
||| 我们
- ✓ 浏览器即用

---

@flow
## 产品上线流程
- 需求评审 / PRD 文档
- 设计开发 / 并行冲刺
- 发布上线 / 灰度验证

---

@timeline
## 里程碑
- 2024 Q1 / 产品上线 / 首批用户 500
- 2025 Q3 / A 轮 / 估值 5000 万
```

> 更多语法见 [AGENTS.md](AGENTS.md) 的 DSL 章节，共 22 种 slide 类型。

---

## 导出的文件长什么样？

### 单文件 HTML
- ✅ 双击打开，键盘 `←` `→` 翻页
- ✅ 数字键 1-9 直接跳屏
- ✅ 手机触屏左右滑动
- ✅ Ctrl+P 打印 / 导出 PDF（每屏一页）
- ✅ 完全离线，发给任何人都能打开

### 分享卡片 ZIP
- 每屏一张 PNG，按序编号
- 4:5 / 3:4 / 9:16 等比例精准输出
- 直接传到手机发朋友圈 / 小红书

---

## 常见问题

<details>
<summary><b>Q: 我不会写代码，能用吗？</b></summary>

能。方式二（AI Agent）完全不需要你懂代码。
把那句话发给 Claude Code / Cursor 等工具，它来处理所有技术细节。

</details>

<details>
<summary><b>Q: 需要网络吗？生成的 PPT 能离线用吗？</b></summary>

生成过程需要联网（下载字体）。
生成后的 HTML 文件完全离线可用，发给任何人都能打开。

</details>

<details>
<summary><b>Q: 怎么支持中文字体？</b></summary>

自动降级到系统字体：macOS 用苹方，Windows 用微软雅黑，Android 用思源黑体。
不需要额外安装字体。

</details>

<details>
<summary><b>Q: 我想修改某个主题的颜色，怎么做？</b></summary>

打开 `src/themes/<主题id>/theme.css`，修改 `--accent`、`--bg`、`--fg` 等 CSS 变量即可。
重启 dev server 后立即生效。

</details>

<details>
<summary><b>Q: 支持几种输出尺寸？</b></summary>

5 种：`16:9`（横屏演讲）、`4:5`（朋友圈）、`3:4`（小红书）、`9:16`（抖音/视频号）、`2.35:1`（公众号头图）。
在编辑器右上角或 Markdown 第一行写 `@ratio 9:16` 切换。

</details>

<details>
<summary><b>Q: 能自己做新主题吗？</b></summary>

可以。在 `src/themes/<id>/` 创建 `theme.css`（定义颜色变量）和 `meta.ts`（元数据）。
重启 dev server 后自动识别。进阶用户可参考 `scripts/generate-blank-decks.mjs`。

</details>

---

## 技术栈

- **前端**：Vite 8 + React 19 + TypeScript + Tailwind CSS v4
- **导出**：`html-to-image`（PNG）+ `jszip`（ZIP）
- **主题系统**：CSS Custom Properties + Container Queries，无构建步骤
- **AI Agent**：AGENTS.md 操作手册 + index.json 结构化元数据 + blank-deck.html 起点文件

---

## 贡献指南

欢迎 PR！贡献新主题请参考：

1. 复制任意一个 `src/themes/<id>/` 目录
2. 修改 `theme.css`（颜色变量）和 `meta.ts`（元数据）
3. 在 `src/examples/<id>.md` 写一份示例
4. 运行 `pnpm release --skip-screenshots` 验证
5. 提 PR，附上截图

---

## Credits

参考并致谢 [@zarazhangrui](https://github.com/zarazhangrui) 的开源工作：
[beautiful-html-templates](https://github.com/zarazhangrui/beautiful-html-templates) ·
[frontend-slides](https://github.com/zarazhangrui/frontend-slides)

---

## License

MIT · 可商用 · 无需署名
