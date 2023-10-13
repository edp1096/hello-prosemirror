import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, DOMOutputSpec, Fragment, Attrs } from "prosemirror-model"


let AlignmentDefinitions = [
    { direction: "left", icon_name: "bi-text-left" },
    { direction: "center", icon_name: "bi-text-center" },
    { direction: "right", icon_name: "bi-text-right" },
    // { direction: "justify", icon_name: "bi-justify" }
]

function getAlignmentAttr(dom: HTMLElement): false | Attrs | null {
    const tagFilter = ["p", "h1", "h2", "h3", "h4", "h5", "h6",]
    if (!tagFilter.includes(dom.tagName.toLowerCase())) { return false }
    if (dom.style.textAlign == "") { return false }

    const attrs: Attrs = {
        tagName: dom.tagName.toLowerCase(),
        alignment: dom.style.textAlign
    }

    return attrs
}

// https://discuss.prosemirror.net/t/implementing-alignment/731
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/TextColorCommand.js#L78
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/FontTypeCommand.js#L82
// https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/TextAlignCommand.js
function SetAlignSchemaNode(nodes: OrderedMap<NodeSpec>): OrderedMap<NodeSpec> {
    const alignNodeSpecsParagraph: NodeSpec = {
        group: 'block',
        // content: "block+", // wrapItem
        content: "inline*", // blockTypeItem
        attrs: {
            tagName: { default: "p" },
            alignment: { default: null }
        },
        defining: true,
        parseDOM: [{ tag: "*", style: "text-align", getAttrs(dom) { return getAlignmentAttr(dom as HTMLElement) } }],
        toDOM(node) { return [node.attrs.tagName, { style: `text-align: ${node.attrs.alignment};` }, 0] }
    }

    // nodes = nodes.addToEnd(`alignment`, alignNodeSpecs)
    // nodes = nodes.addToStart(`alignment`, alignNodeSpecs)
    nodes = nodes.addBefore("paragraph", "alignment", alignNodeSpecsParagraph)

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