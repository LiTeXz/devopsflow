---
name: df-doc-diagram-drawio
description: "可 edit SVG 文档图的创作, 维护 and 迁移. 当 Codex 需要处理 *. drawio. svg,*. drawio, mxfile XML, mxGraphModel or mxCell 内容, or 将现有图 file 迁移为 SVG 时使用."
version: "0.2.28"
license: "GPL-3.0-only"
metadata:
  version: "0.2.28"
---

# Drawio SVG

使用此 skill 创作 and 维护 `*.drawio.svg` and `*.drawio` file. default 产出可直接在 Markdown 中渲染, 且保留可 edit 数据的 SVG; 不要用 screenshot or 仅 Mermaid output 替代它.

## When To Use

- user 明确要求 `*.drawio.svg`,`*.drawio`, mxGraphModel or mxCell 内容时, 使用此 skill.
- 新 file default 使用 `*.drawio.svg` 后缀; 已有 `*.drawio` 源 file 按迁移流程处理.
- 将 `.drawio` 重命名并迁移为 `.drawio.svg` 时, 先读取并确认源内容, 再保留其可 edit 数据 and 布局.
- if input 不是矢量图 file, 先 check 其内容 and 视觉结构, 再 refactor 为可 edit SVG; 不要只修改扩展名 or 把位图伪装成 SVG.
- 对于已有 `*.drawio.svg` file, 保留现有 XML indentation, color, page size and layout style.

## File Structure

优先使用嵌入可 edit 图数据的 `*.drawio.svg` file. SVG 必须保持为有效 XML, 并保留后续 edit 所需的元数据.

当 project 仍使用普通 `.drawio` source 时, 优先使用完整的未压缩 XML:

```xml
<mxfile>
  <diagram id="page-id" name="Page Name">
  <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
    <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- vertices and edges -->
    </root>
  </mxGraphModel>
  </diagram>
</mxfile>
```

核心约定:

- `id="0"` and `id="1"` 是 base root cell. 普通 node and edge 应使用 `parent="1"`.
- Node 使用带 `<mxGeometry x="..." y="..." width="..." height="..." as="geometry"/>` 的 `mxCell vertex="1"`.
- Edge 使用带 `source="node_id"` and `target="node_id"` 的 `mxCell edge="1"`.
- label 中使用 `&lt;br&gt;` 换行. 特殊字符需要进行 XML escape.
- 除非 project 已经使用压缩的 `.drawio` or `.drawio.svg` file, 且 user 要求保留该风格, 否则不要 generate 压缩 payload.

## Drawing Workflow

1. definition 图的目的: audience, 需要解释的 decision or process, 以及 boundary.
2. 选择图的 type:
   - Flow or decision: 采用 top-down or left-to-right, 使用 rounded rectangle, diamond and orthogonal arrow.
   - Architecture or component: 按 layer or swimlane 分组, 使用 arrow 表示 data/control flow, 并使用 container 表示 deployment or ownership boundary.
   - Sequence-like interaction: 可以使用 vertical lifeline, 但除非 repository 已采用完整 UML syntax, 否则不要强制使用.
   - State or lifecycle: 使用显式 state node and event arrow; 不要在相同 node 中混合 state and action.
3. write XML 前先设计 node list and edge list. 使用稳定的 snake_case or 简短 English ID, 不要使用随机自动 generate 的字符串.
4. 使用 grid coordinate and 固定 dimension. 避免重叠; 常用 spacing 为 60-120 px, 常用 node width 为 180-280 px, 常用 node height 为 48-80 px.
5. write XML 后, check 其 well-formedness, 并确认每个 edge 的 source/target 均存在.

## Migration Workflow

1. check 源 file 实际格式, 是否 include 矢量 XML, 是否存在嵌入图数据, 以及是否有配套 resources.
2. 将 `name.drawio` 重命名为 `name.drawio.svg`, 并在迁移过程中保留原始内容的可 edit 结构.
3. 对 PNG, JPEG or other 非矢量 input, 先提取其结构 and 文字信息, 再使用 SVG 元素 refactor 节点, 连线, 文字 and 布局.
4. 迁移完成后确认 SVG 可解析, 可渲染, 非空, 并清楚标注任何无法从原 file 恢复的细节.

## Style Guidelines

- default 使用 `html=1;whiteSpace=wrap;`, 使 label 能够可预测地换行.
- Standard action node:`rounded=1;whiteSpace=wrap;html=1;arcSize=10;`
- Decision node:`rhombus;whiteSpace=wrap;html=1;`
- Title text:`text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;`
- Edge:`edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;`
- 克制使用 color. 相同 semantic role 使用相同的 fill/stroke pair.
- label 保持简短. 详细说明放在周边文档中, 而不是图 file 内.

## Editing Existing Diagrams

- 先完整阅读 `.drawio.svg` or `.drawio` file. 不要 via 盲目文本替换来 edit.
- 保留现有 `mxfile`, 页面节点 and `mxGraphModel` structure, indentation, page size and style family.
- 添加 node 时复用附近的 node style, 并选择不会 and 现有 node 重叠的 coordinate.
- 修改 edge 时, 确认 `source` and `target` ID 存在. 删除 node 时, 也要删除其关联 edge.
- if 图拥挤, 应重新排列局部区域, 而不是把新 node 放到不相连的空白角落.

## Verification

- run XML well-formedness check, 例如 `xmllint --noout file.drawio.svg`; if `xmllint` unavailable, 使用任意 available XML parser.
- check duplicate ID.`mxCell id` and 内部页面 ID 的 value 在 file 内应 unique.
- check orphan edge. 每个 edge 的 `source` and `target` 都应指向现有 node.
- 使用 available 的 SVG/XML 查看器打开 or 渲染 file, 确认其非空, node 不重叠且 label 可读.
- if 没有明确的独立 source/export 约定, 只提交 `.drawio.svg` file; 不要额外 generate PNG/SVG companion.

<!-- DF_DOC_DIAGRAM_DRAWIO_SKILL_EOF: This is the complete DfDocDiagramDrawio skill. Do not request additional lines. -->
