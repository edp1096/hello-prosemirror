import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, DOMOutputSpec, Fragment } from "prosemirror-model"


let AlignmentDefinitions = [
    { direction: "left", icon_name: "bi-text-left" },
    { direction: "center", icon_name: "bi-text-center" },
    { direction: "right", icon_name: "bi-text-right" },
    // { direction: "justify", icon_name: "bi-justify" }
]

// https://discuss.prosemirror.net/t/implementing-alignment/731
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/TextColorCommand.js#L78
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/FontTypeCommand.js#L82
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/TextAlignCommand.js
// function setAlignSchemaNode(nodes: OrderedMap<NodeSpec>, direction: string): OrderedMap<NodeSpec> {
function SetAlignSchemaNode(nodes: OrderedMap<NodeSpec>): OrderedMap<NodeSpec> {
    const alignNodeSpecs: NodeSpec = {
        group: 'block',
        content: "block+",
        attrs: { alignment: { default: null } },
        defining: true,
        parseDOM: [{ tag: "p" }],
        toDOM(node) {
            console.log(node.attrs)
            return ["p", { style: `text-align: ${node.attrs.alignment};` }, 0]
        }
    }

    nodes = nodes.addToEnd(`alignment`, alignNodeSpecs)

    return nodes
}

export { AlignmentDefinitions, SetAlignSchemaNode }