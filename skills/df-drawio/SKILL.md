---
name: df-drawio
description: "Draw.io / diagrams.net diagram 创作与维护。当 Codex 需要创建、编辑、评审、修复或解释应能在 diagrams.net 中正常打开的 .df-drawio.svg 文件、.df-drawio 文件、mxfile XML、mxGraphModel、mxCell node/edge、architecture diagram、flowchart、sequence-like diagram、data-flow diagram、deployment diagram 或 repository documentation diagram 时使用。"
---

# Draw.io

使用此 skill 创作和维护 `.df-drawio.svg` / diagrams.net diagram。优先使用可直接在 Markdown 中渲染、同时仍能在 diagrams.net 中正常打开的单个可编辑 SVG 文件，而不是 screenshot 或仅 Mermaid 输出。

## When To Use

- 用户明确要求 `.df-drawio.svg`、`.df-drawio`、draw.io、diagrams.net、mxGraphModel、architecture diagram、flowchart、deployment diagram 或 data-flow diagram 时，使用此 skill。
- 对于新提交的 documentation diagram，默认使用 `.df-drawio.svg` 后缀。
- 如果 repository 已有 `.df-drawio` 文件，应原地维护，并复用现有 XML indentation、color、page size 和 layout style。
- 对于 lightweight explanatory sketch，Mermaid 通常更快。当 diagram 应直接在 Markdown 中渲染、通过可视化方式编辑、提交到文档或长期维护时，使用 `.df-drawio.svg`。
- 不要将 `.df-drawio.svg` 视为手写 SVG 或 binary image。它是嵌入 diagrams.net data 的 SVG XML，应以结构化方式编辑。

## File Structure

优先使用从 diagrams.net 导出且嵌入 diagram data 的可编辑 `.df-drawio.svg` 文件。SVG 必须保持为有效 XML，并保留可视化编辑所需的 diagrams.net metadata。

当项目仍使用普通 `.df-drawio` source 时，优先使用完整的未压缩 XML：

```xml
<mxfile host="app.diagrams.net">
  <diagram id="diagram-id" name="Diagram Name">
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

核心约定：

- `id="0"` 和 `id="1"` 是 base root cell。普通 node 与 edge 应使用 `parent="1"`。
- Node 使用带 `<mxGeometry x="..." y="..." width="..." height="..." as="geometry"/>` 的 `mxCell vertex="1"`。
- Edge 使用带 `source="node_id"` 和 `target="node_id"` 的 `mxCell edge="1"`。
- label 中使用 `&lt;br&gt;` 换行。特殊字符需要进行 XML escape。
- 除非项目已经使用压缩的 `.df-drawio` 或 `.df-drawio.svg` 文件，且用户要求保留该风格，否则不要生成压缩 diagram payload。

## Drawing Workflow

1. 定义 diagram 目的：audience、需要解释的 decision 或 process，以及 boundary。
2. 选择 diagram type：
   - Flow 或 decision：采用 top-down 或 left-to-right，使用 rounded rectangle、diamond 和 orthogonal arrow。
   - Architecture 或 component：按 layer 或 swimlane 分组，使用 arrow 表示 data/control flow，并使用 container 表示 deployment 或 ownership boundary。
   - Sequence-like interaction：可以使用 vertical lifeline，但除非 repository 已采用完整 UML syntax，否则不要强制使用。
   - State 或 lifecycle：使用显式 state node 和 event arrow；不要在同一 node 中混合 state 与 action。
3. 编写 XML 前先设计 node list 和 edge list。使用稳定的 snake_case 或简短 English ID，不要使用随机自动生成的字符串。
4. 使用 grid coordinate 和固定 dimension。避免重叠；常用 spacing 为 60-120 px，常用 node width 为 180-280 px，常用 node height 为 48-80 px。
5. 编写 XML 后，检查其 well-formedness，并确认每个 edge 的 source/target 均存在。

## Style Guidelines

- 默认使用 `html=1;whiteSpace=wrap;`，使 label 能够可预测地换行。
- Standard action node：`rounded=1;whiteSpace=wrap;html=1;arcSize=10;`
- Decision node：`rhombus;whiteSpace=wrap;html=1;`
- Title text：`text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;`
- Edge：`edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;`
- 克制使用 color。同一 semantic role 使用相同的 fill/stroke pair。
- label 保持简短。详细说明放在周边文档中，而不是 diagram 内。

## Editing Existing Diagrams

- 先完整阅读 `.df-drawio.svg` 或 `.df-drawio` 文件。不要通过盲目文本替换来编辑。
- 保留现有 `mxfile`、`diagram` 和 `mxGraphModel` structure、indentation、page size 与 style family。
- 添加 node 时复用附近的 node style，并选择不会与现有 node 重叠的 coordinate。
- 修改 edge 时，确认 `source` 和 `target` ID 存在。删除 node 时，也要删除其关联 edge。
- 如果 diagram 拥挤，应重新排列局部区域，而不是把新 node 放到不相连的空白角落。

## Verification

- 运行 XML well-formedness 检查，例如 `xmllint --noout file.df-drawio.svg`；如果 `xmllint` 不可用，使用任意可用 XML parser。
- 检查 duplicate ID。`mxCell id` 和 `diagram id` 的值在文件内应唯一。
- 检查 orphan edge。每个 edge 的 `source` 和 `target` 都应指向现有 node。
- 使用 diagrams.net 或可用 draw.io export tool 打开或导出 diagram，确认其非空、node 不重叠且 label 可读。
- 如果没有明确的独立 source/export 约定，只提交 `.df-drawio.svg` 文件。如果 repository 要求独立导出的 PNG/SVG companion，使用现有项目脚本生成。

## Official Sources

- diagrams.net： https://www.diagrams.net/
- Diagram generation docs： https://www.df-drawio.com/docs/reference/diagram-generation/
- draw.io desktop export： https://github.com/jgraph/df-drawio-desktop

<!-- DF_DRAWIO_EOF: This is the complete DfDrawio skill. Do not request additional lines. -->
