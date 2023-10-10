import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, Mark, DOMOutputSpec } from "prosemirror-model"


function getFontSizeList(): number[] {
    const fontSizeList = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72]
    return fontSizeList
}

function setFontSizeSchemaNode(marks: OrderedMap<MarkSpec>, fontSize: number): OrderedMap<MarkSpec> {
    const fontSizeMarkSpec: MarkSpec = {
        group: 'block',
        content: "block*",
        parseDOM: [
            { tag: "span" },
            // { style: "font-size", getAttrs: (value: string) => { /^(\d{2,})pt$/.test(value) && null } }
        ],
        toDOM() { return ["span", { style: `font-size: ${fontSize}pt` }, 0] },
    }

    marks = marks.addToEnd(`fontsize${fontSize}`, fontSizeMarkSpec)

    return marks
}

export { getFontSizeList, setFontSizeSchemaNode }