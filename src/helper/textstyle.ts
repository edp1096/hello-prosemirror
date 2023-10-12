import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, Mark, DOMOutputSpec, Fragment, ParseRule } from "prosemirror-model"


const FontSizeList = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72]
const DropDownOptions = { title: "Set font size", label: "Aa" }

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

export { FontSizeList, DropDownOptions, setFontSizeSchemaMark }