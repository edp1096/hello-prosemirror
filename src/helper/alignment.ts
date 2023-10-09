import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, DOMOutputSpec } from "prosemirror-model"


function setAlignNodes(nodes: OrderedMap<NodeSpec>, direction:string): OrderedMap<NodeSpec> {
    const alignNodeSpecs: NodeSpec = {
        group: 'block',
        // attrs: {},
        content: "inline*",
        toDOM(node: Node) { return ["p", 0] },
        parseDOM: [{ tag: direction }],
    }

    nodes = nodes.addToEnd(`align${direction}`, alignNodeSpecs)

    // return nodes.append(alignNodeSpecs)
    return nodes
}

export { setAlignNodes }