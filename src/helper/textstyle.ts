import OrderedMap from 'orderedmap'
import { Mark, MarkSpec, MarkType, Attrs, DOMOutputSpec, Fragment, ParseRule } from "prosemirror-model"


const FontSizeList = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72]
// const DropDownMenuName = { title: "Set font size", label: "Aa" }

function getFontSizeAttr(dom: HTMLElement): false | Attrs | null {
    return { fontSize: parseInt((dom as HTMLElement).style.fontSize.replace("pt", "")) }
}

function SetFontSizeSchemaMark(marks: OrderedMap<MarkSpec>): OrderedMap<MarkSpec> {
    const fontSizeMarkSpec: MarkSpec = {
        attrs: { fontSize: { default: null } },
        inclusive: true,
        parseDOM: [{ tag: "span", style: "font-size", getAttrs(dom) { return getFontSizeAttr(dom as HTMLElement) } }],
        toDOM(m) { return ["span", { style: `font-size: ${m.attrs.fontSize}pt;` }, 0] }
    }

    marks = marks.addToEnd(`fontsize`, fontSizeMarkSpec)

    return marks
}

export { FontSizeList, SetFontSizeSchemaMark }