import OrderedMap from 'orderedmap'
import { Schema, NodeSpec, Node, MarkSpec, Mark, DOMOutputSpec, Fragment } from "prosemirror-model"


const FontSizeList = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72]

// function setFontSizeSchemaMark(marks: OrderedMap<MarkSpec>, fontSize: number): OrderedMap<MarkSpec> {
function setFontSizeSchemaMark(marks: OrderedMap<MarkSpec>, fontSize: number): OrderedMap<MarkSpec> {
    const fontSizeMarkSpec: MarkSpec = {
        // group: 'block',
        // content: "inline+",
        attrs: {
            fontSize: { default: null },
            style: {}
        },
        parseDOM: [
            {
                tag: "p",
                getContent(node, schema) {
                    console.log(node, schema)
                    return new Fragment()
                }
            },
        ],
        toDOM(mark) {
            // let domSpec: DOMOutputSpec = ""
            // console.log(node.attrs, fontSize)
            // if (node.attrs.fontSize == fontSize) {
            //     domSpec = ["span", { style: `font-size: ${fontSize}pt` }, 0]
            // }
            // return domSpec

            console.log(mark.type.schema, fontSize)
            return ["span", { style: `font-size: ${fontSize}pt` }, 0]
        }
    }

    marks = marks.addToEnd(`fontsize${fontSize}`, fontSizeMarkSpec)

    return marks
}

export { FontSizeList, setFontSizeSchemaMark }