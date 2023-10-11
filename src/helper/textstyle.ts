import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, Mark, DOMOutputSpec, Fragment } from "prosemirror-model"


const FontSizeList = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72]

// function setFontSizeSchemaMark(marks: OrderedMap<MarkSpec>, fontSize: number): OrderedMap<MarkSpec> {
function setFontSizeSchemaMark(marks: OrderedMap<MarkSpec>, fontSize: number): OrderedMap<MarkSpec> {
    const fontSizeMarkSpec: MarkSpec = {
        // group: 'block',
        // content: "inline+",
        inclusive: true,
        // parseDOM: [{ tag: "span" }],
        toDOM() { return ["span", { style: `font-size: ${fontSize}pt;` }, 0] }
    }

    marks = marks.addToEnd(`fontsize${fontSize}`, fontSizeMarkSpec)

    return marks
}

export { FontSizeList, setFontSizeSchemaMark }