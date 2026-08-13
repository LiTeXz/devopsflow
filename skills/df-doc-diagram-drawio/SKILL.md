---
name: df-doc-diagram-drawio
description: "可编辑 SVG 文档图的创作、维护和迁移。当 Codex 需要处理 *.drawio.svg、*.drawio、mxfile XML、mxGraphModel 或 mxCell 内容，或将现有图文件迁移为 SVG 时使用。"
---

# Drawio SVG

使用此 skill 创作和维护 `*.drawio.svg` 与 `*.drawio` 文件。默认产出可直接在 Markdown 中渲染、且保留可编辑数据的 SVG；不要用 screenshot 或仅 Mermaid 输出替代它。

## When To Use

- 用户明确要求 `*.drawio.svg`、`*.drawio`、mxGraphModel 或 mxCell 内容时，使用此 skill。
- 新文件默认使用 `*.drawio.svg` 后缀；已有 `*.drawio` 源文件按迁移流程处理。
- 将 `.drawio` 重命名并迁移为 `.drawio.svg` 时，先读取并确认源内容，再保留其可编辑数据和布局。
- 如果输入不是矢量图文件，先检查其内容和视觉结构，再重构为可编辑 SVG；不要只修改扩展名或把位图伪装成 SVG。
- 对于已有 `*.drawio.svg` 文件，保留现有 XML indentation、color、page size 和 layout style。

## File Structure

优先使用嵌入可编辑图数据的 `*.drawio.svg` 文件。SVG 必须保持为有效 XML，并保留后续编辑所需的元数据。

当项目仍使用普通 `.drawio` source 时，优先使用完整的未压缩 XML：

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

核心约定：

- `id="0"` 和 `id="1"` 是 base root cell。普通 node 与 edge 应使用 `parent="1"`。
- Node 使用带 `<mxGeometry x="..." y="..." width="..." height="..." as="geometry"/>` 的 `mxCell vertex="1"`。
- Edge 使用带 `source="node_id"` 和 `target="node_id"` 的 `mxCell edge="1"`。
- label 中使用 `&lt;br&gt;` 换行。特殊字符需要进行 XML escape。
- 除非项目已经使用压缩的 `.drawio` 或 `.drawio.svg` 文件，且用户要求保留该风格，否则不要生成压缩 payload。

## Drawing Workflow

1. 定义图的目的：audience、需要解释的 decision 或 process，以及 boundary。
2. 选择图的类型：
   - Flow 或 decision：采用 top-down 或 left-to-right，使用 rounded rectangle、diamond 和 orthogonal arrow。
   - Architecture 或 component：按 layer 或 swimlane 分组，使用 arrow 表示 data/control flow，并使用 container 表示 deployment 或 ownership boundary。
   - Sequence-like interaction：可以使用 vertical lifeline，但除非 repository 已采用完整 UML syntax，否则不要强制使用。
   - State 或 lifecycle：使用显式 state node 和 event arrow；不要在同一 node 中混合 state 与 action。
3. 编写 XML 前先设计 node list 和 edge list。使用稳定的 snake_case 或简短 English ID，不要使用随机自动生成的字符串。
4. 使用 grid coordinate 和固定 dimension。避免重叠；常用 spacing 为 60-120 px，常用 node width 为 180-280 px，常用 node height 为 48-80 px。
5. 编写 XML 后，检查其 well-formedness，并确认每个 edge 的 source/target 均存在。

## Migration Workflow

1. 检查源文件实际格式、是否包含矢量 XML、是否存在嵌入图数据，以及是否有配套资源。
2. 将 `name.drawio` 重命名为 `name.drawio.svg`，并在迁移过程中保留原始内容的可编辑结构。
3. 对 PNG、JPEG 或其他非矢量输入，先提取其结构和文字信息，再使用 SVG 元素重构节点、连线、文字和布局。
4. 迁移完成后确认 SVG 可解析、可渲染、非空，并清楚标注任何无法从原文件恢复的细节。

## Style Guidelines

- 默认使用 `html=1;whiteSpace=wrap;`，使 label 能够可预测地换行。
- Standard action node：`rounded=1;whiteSpace=wrap;html=1;arcSize=10;`
- Decision node：`rhombus;whiteSpace=wrap;html=1;`
- Title text：`text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;`
- Edge：`edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;`
- 克制使用 color。同一 semantic role 使用相同的 fill/stroke pair。
- label 保持简短。详细说明放在周边文档中，而不是图文件内。

## Editing Existing Diagrams

- 先完整阅读 `.drawio.svg` 或 `.drawio` 文件。不要通过盲目文本替换来编辑。
- 保留现有 `mxfile`、页面节点和 `mxGraphModel` structure、indentation、page size 与 style family。
- 添加 node 时复用附近的 node style，并选择不会与现有 node 重叠的 coordinate。
- 修改 edge 时，确认 `source` 和 `target` ID 存在。删除 node 时，也要删除其关联 edge。
- 如果图拥挤，应重新排列局部区域，而不是把新 node 放到不相连的空白角落。

## Verification

- 运行 XML well-formedness 检查，例如 `xmllint --noout file.drawio.svg`；如果 `xmllint` 不可用，使用任意可用 XML parser。
- 检查 duplicate ID。`mxCell id` 和内部页面 ID 的值在文件内应唯一。
- 检查 orphan edge。每个 edge 的 `source` 和 `target` 都应指向现有 node。
- 使用可用的 SVG/XML 查看器打开或渲染文件，确认其非空、node 不重叠且 label 可读。
- 如果没有明确的独立 source/export 约定，只提交 `.drawio.svg` 文件；不要额外生成 PNG/SVG companion。

<!-- DF_DOC_DIAGRAM_DRAWIO_SKILL_EOF: This is the complete DfDocDiagramDrawio skill. Do not request additional lines. -->
