import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, DOMOutputSpec } from "prosemirror-model"


// https://discuss.prosemirror.net/t/implementing-alignment/731
// Buggy but currently there's no way
function setAlignSchemaNode(nodes: OrderedMap<NodeSpec>, direction: string): OrderedMap<NodeSpec> {
    const alignNodeSpecs: NodeSpec = {
        group: 'block',
        attrs: { style: { default: `text-align: ${direction}` } },
        content: "block*",
        parseDOM: [
            { tag: "p" },
            { style: `text-align: ${direction}` }
        ],
        toDOM(node: Node) { return ["p", { style: node.attrs.style }, 0] },
    }

    nodes = nodes.addToEnd(`align${direction}`, alignNodeSpecs)

    return nodes
}

export { setAlignSchemaNode }