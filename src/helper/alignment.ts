import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, DOMOutputSpec, Fragment, Attrs } from "prosemirror-model"


let AlignmentDefinitions = [
    { direction: "left", icon_name: "bi-text-left" },
    { direction: "center", icon_name: "bi-text-center" },
    { direction: "right", icon_name: "bi-text-right" },
    // { direction: "justify", icon_name: "bi-justify" }
]

function getAlignmentAttr(dom: HTMLElement): false | Attrs | null {
    return { alignment: dom.style.textAlign }
}

// https://discuss.prosemirror.net/t/implementing-alignment/731
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/TextColorCommand.js#L78
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/FontTypeCommand.js#L82
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/TextAlignCommand.js
function SetAlignSchemaNode(nodes: OrderedMap<NodeSpec>): OrderedMap<NodeSpec> {
    const alignNodeSpecs: NodeSpec = {
        group: 'block',
        // content: "block+", // wrapItem
        content: "inline*", // blockTypeItem
        attrs: { alignment: { default: null } },
        parseDOM: [{ tag: "p", style: "text-align", getAttrs(dom) { return getAlignmentAttr(dom as HTMLElement) } }],
        toDOM(node) { return ["p", { style: `text-align: ${node.attrs.alignment};` }, 0] }
    }

    // nodes = nodes.addToEnd(`alignment`, alignNodeSpecs)
    // nodes = nodes.addToStart(`alignment`, alignNodeSpecs)
    nodes = nodes.addBefore("paragraph", "alignment", alignNodeSpecs)

    return nodes
}

function SetAlignSchemaMark(nodes: OrderedMap<MarkSpec>): OrderedMap<MarkSpec> {
    const alignMarkSpecs: MarkSpec = {
        group: 'block',
        // content: "block+", // wrapItem
        content: "inline+", // blockTypeItem
        attrs: { alignment: { default: null } },
        inclusive: true,
        parseDOM: [{ tag: "span" }],
        toDOM(node) { return ["span", { style: `text-align: ${node.attrs.alignment};` }, 0] }
    }

    nodes = nodes.addToEnd(`alignment`, alignMarkSpecs)

    return nodes
}

export { AlignmentDefinitions, SetAlignSchemaNode, SetAlignSchemaMark }