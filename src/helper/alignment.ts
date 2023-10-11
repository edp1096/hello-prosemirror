import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, DOMOutputSpec } from "prosemirror-model"


// https://discuss.prosemirror.net/t/implementing-alignment/731
function setAlignSchemaNode(nodes: OrderedMap<NodeSpec>, direction: string): OrderedMap<NodeSpec> {
    const alignNodeSpecs: NodeSpec = {
        group: 'block',
        content: "inline+",
        attrs: { style: { default: `text-align: ${direction}` } },
        defining: true,
        parseDOM: [
            { tag: "p" },
            { style: `text-align: left` },
            { style: `text-align: center` },
            { style: `text-align: right` },
        ],
        toDOM(node) { return ["p", { style: node.attrs.style }, 0] },
    }

    nodes = nodes.addToEnd(`align${direction}`, alignNodeSpecs)

    return nodes
}

export { setAlignSchemaNode }