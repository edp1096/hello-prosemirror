import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, DOMOutputSpec, Fragment, Attrs } from "prosemirror-model"


let AlignmentDefinitions = [
    { direction: "left", icon_name: "icon-align-left" },
    { direction: "center", icon_name: "icon-align-center" },
    { direction: "right", icon_name: "icon-align-right" },
    // { direction: "justify", icon_name: "icon-align-justify" }
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

function SetAlignSchemaNode(nodes: OrderedMap<NodeSpec>): OrderedMap<NodeSpec> {
    const alignNodeSpecsParagraph: NodeSpec = {
        group: 'block',
        content: "inline*",
        attrs: {
            tagName: { default: "p" },
            alignment: { default: null }
        },
        defining: true,
        parseDOM: [{ tag: "*", style: "text-align", getAttrs(dom) { return getAlignmentAttr(dom as HTMLElement) } }],
        toDOM(node) {
            if (node.attrs.alignment) {
                return [node.attrs.tagName, { style: `text-align: ${node.attrs.alignment};` }, 0]
            }

            return [node.attrs.tagName, 0]
        }
    }

    return nodes.addBefore("paragraph", "alignment", alignNodeSpecsParagraph)
}

export { AlignmentDefinitions, SetAlignSchemaNode }