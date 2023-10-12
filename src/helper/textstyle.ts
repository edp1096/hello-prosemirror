import OrderedMap from 'orderedmap'
import { Schema, Node, NodeSpec, NodeType, Mark, MarkSpec, MarkType, DOMOutputSpec, Fragment, ParseRule } from "prosemirror-model"
import { NodeSelection, EditorState, TextSelection, SelectionRange, Command, Transaction } from "prosemirror-state"


const FontSizeList = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72]
// const DropDownMenuName = { title: "Set font size", label: "Aa" }

function setFontSizeSchemaMark(marks: OrderedMap<MarkSpec>): OrderedMap<MarkSpec> {
    const fontSizeMarkSpec: MarkSpec = {
        attrs: { fontSize: { default: null } },
        inclusive: true,
        parseDOM: [{ tag: "span" }],
        toDOM(m) { return ["span", { style: `font-size: ${m.attrs.fontSize}pt;` }, 0] }
    }

    marks = marks.addToEnd(`fontsize`, fontSizeMarkSpec)

    return marks
}

export { FontSizeList, setFontSizeSchemaMark }