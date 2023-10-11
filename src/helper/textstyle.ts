import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, Mark, DOMOutputSpec } from "prosemirror-model"


const FontSizeList = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72]

function setFontSizeSchemaMark(marks: OrderedMap<MarkSpec>, fontSize: number): OrderedMap<MarkSpec> {
    const fontSizeMarkSpec: MarkSpec = {
        group: 'block',
        content: "block*",
        attrs: { style: { default: `font-size: ${fontSize}` } },
        parseDOM: [
            { tag: "span" },
            { tag: "span", clearMark: m => m.type.name == "span" },
            // { style: "font-size" },
            // { style: "font-size", clearMark: m => m.type.name == "span" },
        ],
        toDOM() { return ["span", { style: `font-size: ${fontSize}pt` }, 0] },
    }

    marks = marks.addToEnd(`fontsize${fontSize}`, fontSizeMarkSpec)

    return marks
}

export { FontSizeList, setFontSizeSchemaMark }