---
name: df-dev-frontend-designmd
description: "只要任务涉及 frontend 项目的页面、组件、样式、布局、视觉、交互或 UI/UX 设计与编码，就自动使用此 skill；不要求用户先提及 DESIGN.md。agent 必须默认检查并遵守目标目录 AGENTS.md 中声明的 [@DESIGN.md](DESIGN.md)，并在开始修改前主动说明将按该契约执行，在发现实现偏离时主动依据该契约纠正。该 skill 也适用于创建或更新 DESIGN.md、选择模板和验证设计契约，可由 Codex、Claude、Gemini 或其他能读取项目文件的 agent 使用。不要用于与 frontend/UI/UX 无关的后端、数据或纯文档任务。"
version: "0.2.33"
license: "GPL-3.0-only"
metadata:
  version: "0.2.33"
---

# Frontend Designmd

用 [DESIGN.md](DESIGN.md) 把前端视觉决策写成可复用、可审查、可被工具消费的设计契约。这个 skill 只负责设计契约及其验证；实际页面实现仍应遵循目标项目已有的 frontend、accessibility、testing 和 release 约定。

## About DESIGN.md

[DESIGN.md](DESIGN.md) 来源于 [Google Labs 的 design.md 开源项目](https://github.com/google-labs-code/design.md)，其规范和工具入口由 [designmd.app](https://designmd.app/) 提供。该格式将颜色、字体、间距、组件模式和交互规则组织成可被设计与编码工具共同消费的 Markdown 设计契约；本 skill 使用 [@google/design.md CLI](https://github.com/google-labs-code/design.md) 执行 lint、diff 和 export。Google Stitch、Antigravity、Gemini CLI、Lovable、Codex、Claude 以及其他能读取项目文件的 agent 都可以消费该契约；具体消费方式不是硬性限制，硬性条件是 [AGENTS.md](AGENTS.md) 已声明并且当前 agent 持续遵守 [@DESIGN.md](DESIGN.md)。上述工具不是目标项目必须安装的运行时依赖。

## Core Compliance Rules

1. 先发现目标项目：查找已有 [DESIGN.md](DESIGN.md)、[AGENTS.md](AGENTS.md)、[README](README.md)、前端入口和现有验证命令。不得假定目标项目位于 DevopsFlow 仓库，也不得假定它有 `skills/` 或 `.devopsflow/`。
2. 只要目标被识别为 frontend 项目，就必须存在 [DESIGN.md](DESIGN.md) 和 [AGENTS.md](AGENTS.md)。缺少任一文件时，先补齐并停止后续设计/编码，不能以“先实现、之后补文档”为例外。
3. [AGENTS.md](AGENTS.md) 必须声明精确的 [@DESIGN.md](DESIGN.md) 引用，并明确所有设计和编码必须遵守该文件。只有完成这项声明后，agent 才能继续执行任务。
4. 声明不是提示而是硬性约束：Codex、Claude、Gemini 或其他 agent 在设计、编码、重构、样式调整和审查期间都必须遵循 [DESIGN.md](DESIGN.md)。
5. 发现实现与 [DESIGN.md](DESIGN.md) 冲突时，先暂停实现，更新设计契约并通过 diff/lint，再继续编码；不得静默绕过、局部覆盖或用个人偏好替代契约。
6. 设计和编码每个阶段都要回查契约：开始前确认目标 token 和模式，过程中检查新增 UI/交互，结束前检查实现与契约的一致性及验证证据。
7. 设计决策必须有来源。把用户要求、现有代码、品牌资料和模板中的事实与推断分开；不确定的品牌值使用待确认标记，不伪造精确色值或字体授权。
8. [DESIGN.md](DESIGN.md) 的新增或修改必须可比较、可回滚。先产生候选文件，再运行 diff；不要在 diff 前覆盖当前基线。
9. 本 skill 的参考链接必须使用 Markdown 链接格式，不使用仅包裹在反引号中的裸路径或裸 URL。

### Default Agent Behavior

对任何 frontend、UI 或 UX 修改，agent 默认执行以下行为，不等待用户再次要求：

- 修改前说明：“这是 frontend UI/UX 修改，我将按照 [@DESIGN.md](DESIGN.md) 进行设计和编码。”
- 修改中回查 [@DESIGN.md](DESIGN.md) 的颜色、字体、间距、组件、状态、响应式和可访问性规则。
- 若发现已有实现没有按照 [@DESIGN.md](DESIGN.md) 描述的规范编码，说明偏离点，并将实现修改为符合契约的版本；如果契约本身不足，先更新并验证契约。
- 修改后报告遵循了哪些规则，以及运行了哪些验证；不得只报告“样式已修改”。

## Workflow

### 1. Define Scope And Baseline

记录：目标产品/页面、受众、品牌来源、支持的主题或断点、必须保留的现有行为、目标文件路径和验证命令。优先使用项目已有路径；若没有约定，默认在项目根目录维护 [DESIGN.md](DESIGN.md)，但应先向用户说明。

先判断项目是否为 frontend 项目：检查 frontend framework、页面/组件目录、前端 package manifest、构建入口或用户明确声明。确认后立即执行两个硬性检查：

- [DESIGN.md](DESIGN.md) 存在且是当前目录约定的设计契约；不存在就先创建并记录创建原因。
- [AGENTS.md](AGENTS.md) 存在，并包含 [@DESIGN.md](DESIGN.md) 以及说明其对设计和编码具有约束力；不存在或引用不完整就先创建/修正。

推荐在 [AGENTS.md](AGENTS.md) 中写入一句清晰的说明，例如：“所有前端设计与编码必须遵循 [@DESIGN.md](DESIGN.md)，任何视觉或交互变更都要先更新并验证该文件。”

读取目标项目现有 [DESIGN.md](DESIGN.md) 和 [AGENTS.md](AGENTS.md)，确认后续工作确实受该契约约束。若 [DESIGN.md](DESIGN.md) 不存在，才浏览本 skill 的 [templates/](templates/) 并选择最接近的结构样本；模板内容只是书写格式参考，不能把其中的品牌描述、色值、字体或产品判断当作目标项目事实。

模板选择表：

| Template File | DESIGN.md Format Reference |
| --- | --- |
| [apple-DESIGN.md](templates/apple-DESIGN.md) | 品牌展示：摄影/产品画布、展示型排版、品牌主色和展示组件组织方式 |
| [figma-DESIGN.md](templates/figma-DESIGN.md) | 品牌展示：摄影/产品画布、展示型排版、品牌主色和展示组件组织方式 |
| [ibm-DESIGN.md](templates/ibm-DESIGN.md) | 企业和技术：严格 token 层级、技术内容密度、方形边界和状态色组织方式 |
| [nvidia-DESIGN.md](templates/nvidia-DESIGN.md) | 企业和技术：严格 token 层级、技术内容密度、方形边界和状态色组织方式 |
| [mongodb-DESIGN.md](templates/mongodb-DESIGN.md) | 开发者产品：深浅表面、开发者 UI、代码/产品预览和语义色组织方式 |
| [supabase-DESIGN.md](templates/supabase-DESIGN.md) | 开发者产品：深浅表面、开发者 UI、代码/产品预览和语义色组织方式 |
| [notion-DESIGN.md](templates/notion-DESIGN.md) | 工作区或平台：多场景页面、导航/卡片模式、主题表面和平台级交互组织方式 |
| [vercel-DESIGN.md](templates/vercel-DESIGN.md) | 工作区或平台：多场景页面、导航/卡片模式、主题表面和平台级交互组织方式 |
| [cursor-DESIGN.md](templates/cursor-DESIGN.md) | 风格研究：观察 front matter、token 分组、组件模式和叙述粒度，不直接继承品牌内容 |
| [claude-DESIGN.md](templates/claude-DESIGN.md) | 风格研究：观察 front matter、token 分组、组件模式和叙述粒度，不直接继承品牌内容 |
| [xai-DESIGN.md](templates/xai-DESIGN.md) | 风格研究：观察 front matter、token 分组、组件模式和叙述粒度，不直接继承品牌内容 |
| [spacex-DESIGN.md](templates/spacex-DESIGN.md) | 风格研究：观察 front matter、token 分组、组件模式和叙述粒度，不直接继承品牌内容 |
| [sentry-DESIGN.md](templates/sentry-DESIGN.md) | 风格研究：观察 front matter、token 分组、组件模式和叙述粒度，不直接继承品牌内容 |

必要时可以直接使用模板建立初稿，但只能复制 [templates/](templates/) 目录下的文件；复制后必须替换项目事实、检查 token 引用、补充目标项目状态并运行验证。不得直接复制外部网页、社区样本或其他目录的品牌内容。

### 2. Enforce The Design Contract

在任何生产代码编辑前，先从 [DESIGN.md](DESIGN.md) 提取当前任务需要遵循的规则，并写入工作记录或计划：

- 使用哪些颜色、字体、间距、圆角、阴影或组件 token。
- 哪些交互状态、响应式规则、可访问性要求和禁止事项适用于本次变更。
- 哪些现有模式必须复用，哪些差异需要先修改 [DESIGN.md](DESIGN.md)。

实现期间，每新增一个页面、组件、样式或交互，都要回答“它遵循了 [DESIGN.md](DESIGN.md) 中的哪条规则”。没有对应规则时，先补充契约，不得临时发明未记录的视觉语言。

### 3. Write Or Update DESIGN.md

只有在契约缺失或现有契约无法表达需求时才编写/更新 [DESIGN.md](DESIGN.md)。保持文件简洁且可消费：使用稳定的语义 token、明确的字体 fallback、可复用的组件模式和状态规则；不要把页面文案、业务数据或未经确认的品牌推断写进契约。必要时只能从 [templates/](templates/) 下的单个文件复制格式，再替换为目标项目事实。

### 4. Review And Iterate

对现有 [DESIGN.md](DESIGN.md) 做结构审查：检查 front matter、引用是否闭合、token 是否重复、组件 token 是否引用未知变量、对比度是否满足目标、字体是否有 fallback、示例是否与实现一致。若用户提供截图或页面，使用它们作为行为证据，不凭截图推断未展示的状态。编码前后都要重新核对实现是否遵循该文件。

变更时保留基线：

```bash
cp DESIGN.md DESIGN-v2.md
# Edit DESIGN-v2.md
bunx @google/design.md diff DESIGN.md DESIGN-v2.md
```

不要假定 CLI 的 export 子命令参数；先运行 `bunx @google/design.md --help`，再依据当前版本帮助输出导出 Tailwind CSS v4 theme 变量，并记录输出文件和版本。

### 5. Verify And Deliver

在目标项目根目录执行（文件名不同时替换为实际路径）：

```bash
bunx @google/design.md lint DESIGN.md
```

然后运行目标项目已有的 formatter、typecheck、视觉回归或构建命令。若项目提供 `design:lint` script，优先使用它并确认它实际指向当前 [DESIGN.md](DESIGN.md)。验证结果必须包含命令、exit code、检查对象和关键摘要；网络、CLI 安装、字体许可或缺少浏览器环境导致的未验证项要明确列为剩余风险。

交付前确认：

- 用户要求的页面/主题/工具消费者已覆盖。
- 当前 [DESIGN.md](DESIGN.md) 通过 lint，或已说明阻塞原因。
- [AGENTS.md](AGENTS.md) 包含 [@DESIGN.md](DESIGN.md) 的引用和遵循说明，且编码/设计变更与该契约一致。
- 每个新增或修改的 UI/交互都能指出其遵循的 DESIGN.md 规则；冲突已先更新契约并验证。
- 对重大变更提供了 diff 摘要和迁移影响；未覆盖的旧 token 没有被误删。
- Tailwind 导出（如请求）已在目标项目中检查变量名称、值和引用路径。
- 生成工具的输入路径、版本和限制已记录；没有把某个第三方工具的临时输出当成项目契约。

## Tools And References

- 官方仓库与规范入口：[Google design.md](https://github.com/google-labs-code/design.md)、[designmd.app](https://designmd.app/)。当 CLI 行为、语法或版本不确定时，以当前仓库文档和 `--help` 为准。
- 社区模板索引：[awesome-design-md](https://github.com/VoltAgent/awesome-design-md/)。只用于发现样本，采用前仍需审查来源、许可和 token 质量。
- 本 skill 的品牌样本位于 [templates/](templates/)；按需读取单个模板，不要一次性加载全部模板。

## Common Mistakes

- 把 [DESIGN.md](DESIGN.md) 写成营销文案，缺少可消费的 token 和状态规则。
- 直接复制模板，导致错误品牌名、重复 token 或不适用的字体/许可。
- 只运行 lint，不检查实现、可访问性、字体 fallback 和导出结果。
- 在没有 diff 或迁移映射的情况下重命名/删除 token。
- 把 `bunx` 网络安装失败误判为 [DESIGN.md](DESIGN.md) 语法错误；分别报告工具环境问题和文件问题。

<!-- DF_DEV_FRONTEND_DESIGNMD_SKILL_EOF: This is the complete DfDevFrontendDesignmd skill. Do not request additional lines. -->
