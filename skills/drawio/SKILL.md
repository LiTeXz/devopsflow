---
name: drawio
description: "Draw.io / diagrams.net diagram authoring and maintenance. Use when Codex needs to create, edit, review, repair, or explain .drawio.svg files, .drawio files, mxfile XML, mxGraphModel, mxCell nodes/edges, architecture diagrams, flowcharts, sequence-like diagrams, data-flow diagrams, deployment diagrams, or repository documentation diagrams that should open cleanly in diagrams.net."
---

# Draw.io

Use this skill to author and maintain `.drawio.svg` / diagrams.net diagrams. Prefer a single editable SVG file that renders directly in Markdown and still opens cleanly in diagrams.net, instead of screenshots or Mermaid-only output.

## When To Use

- Use this skill when the user explicitly asks for `.drawio.svg`, `.drawio`, draw.io, diagrams.net, mxGraphModel, architecture diagrams, flowcharts, deployment diagrams, or data-flow diagrams.
- For new committed documentation diagrams, default to the `.drawio.svg` suffix.
- If the repository already has `.drawio` files, maintain them in place and reuse the existing XML indentation, colors, page size, and layout style.
- Mermaid is often faster for lightweight explanatory sketches. Use `.drawio.svg` when the diagram should render directly in Markdown, be edited visually, committed to documentation, or maintained over time.
- Do not treat `.drawio.svg` as a hand-written SVG or binary image. It is SVG XML with embedded diagrams.net data and should be edited structurally.

## File Structure

Prefer editable `.drawio.svg` files exported from diagrams.net with embedded diagram data. The SVG must remain valid XML and preserve the diagrams.net metadata needed for visual editing.

When the project still uses plain `.drawio` sources, prefer full uncompressed XML:

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

Core conventions:

- `id="0"` and `id="1"` are the base root cells. Normal nodes and edges should use `parent="1"`.
- Nodes use `mxCell vertex="1"` with `<mxGeometry x="..." y="..." width="..." height="..." as="geometry"/>`.
- Edges use `mxCell edge="1"` with `source="node_id"` and `target="node_id"`.
- Use `&lt;br&gt;` for line breaks in labels. XML-escape special characters.
- Do not generate compressed diagram payloads unless the project already uses compressed `.drawio` or `.drawio.svg` files and the user asks to preserve that style.

## Drawing Workflow

1. Define the diagram purpose: audience, decision or process to explain, and boundary.
2. Pick the diagram type:
   - Flow or decision: top-down or left-to-right, with rounded rectangles, diamonds, and orthogonal arrows.
   - Architecture or components: group by layer or swimlane, use arrows for data/control flow, and use containers for deployment or ownership boundaries.
   - Sequence-like interaction: vertical lifelines are fine, but do not force full UML syntax unless the repository already does.
   - State or lifecycle: use explicit state nodes and event arrows; do not mix states and actions in the same node.
3. Design the node list and edge list before writing XML. Use stable snake_case or short English IDs, not random auto-generated strings.
4. Use grid coordinates and fixed dimensions. Avoid overlaps; common spacing is 60-120 px, common node width is 180-280 px, and common node height is 48-80 px.
5. After writing XML, check that it is well formed and that every edge source/target exists.

## Style Guidelines

- Default to `html=1;whiteSpace=wrap;` so labels wrap predictably.
- Standard action node: `rounded=1;whiteSpace=wrap;html=1;arcSize=10;`
- Decision node: `rhombus;whiteSpace=wrap;html=1;`
- Title text: `text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;`
- Edge: `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;`
- Keep colors restrained. Use the same fill/stroke pair for the same semantic role.
- Keep labels short. Put detailed explanation in the surrounding document, not inside the diagram.

## Editing Existing Diagrams

- Read the full `.drawio.svg` or `.drawio` file first. Do not edit by blind text replacement.
- Preserve the existing `mxfile`, `diagram`, and `mxGraphModel` structure, indentation, page size, and style family.
- Reuse nearby node styles when adding nodes, and choose coordinates that do not overlap existing nodes.
- When changing edges, verify that `source` and `target` IDs exist. When deleting a node, delete its associated edges too.
- If the diagram is crowded, rearrange the local area instead of placing new nodes in a disconnected empty corner.

## Verification

- Run an XML well-formedness check such as `xmllint --noout file.drawio.svg`; if `xmllint` is unavailable, use any available XML parser.
- Check for duplicate IDs. `mxCell id` and `diagram id` values should be unique within the file.
- Check for orphan edges. Every edge `source` and `target` should point to an existing node.
- Open or export the diagram with diagrams.net or an available draw.io export tool to confirm it is not blank, nodes do not overlap, and labels are readable.
- Without an explicit separate source/export convention, commit only the `.drawio.svg` file. If the repository requires separate exported PNG/SVG companions, generate them with the existing project script.

## Official Sources

- diagrams.net: https://www.diagrams.net/
- Diagram generation docs: https://www.drawio.com/docs/reference/diagram-generation/
- draw.io desktop export: https://github.com/jgraph/drawio-desktop
