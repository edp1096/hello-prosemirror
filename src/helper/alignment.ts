import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, DOMOutputSpec } from "prosemirror-model"


// https://discuss.prosemirror.net/t/implementing-alignment/731
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/TextColorCommand.js#L78
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/FontTypeCommand.js#L82
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/TextAlignCommand.js
function setAlignSchemaNode(nodes: OrderedMap<NodeSpec>, direction: string): OrderedMap<NodeSpec> {
    const alignNodeSpecs: NodeSpec = {
        group: 'block',
        content: "inline+",
        attrs: { style: { default: `text-align: ${direction}` } },
        parseDOM: [
            { tag: "p", style: `text-align: left` },
            { tag: "p", style: `text-align: center` },
            { tag: "p", style: `text-align: right` },
        ],
        toDOM(node) { return ["p", { style: node.attrs.style }, 0] },
    }

    nodes = nodes.addToEnd(`align${direction}`, alignNodeSpecs)

    return nodes
}

export { setAlignSchemaNode }