import OrderedMap from 'orderedmap'
import { MarkSpec, MarkType, Attrs } from "prosemirror-model"
import { EditorState, Plugin } from "prosemirror-state"
import { MenuItem, MenuElement, MenuItemSpec } from "prosemirror-menu"
import { EditorView } from "prosemirror-view"

import { setIconElement, setMark, setMarkFontStyle } from "./utils"

const FontSizeList = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72]
let fontStyleMarkType: MarkType

const colorPicker = document.createElement("input")
colorPicker.setAttribute("type", "color")
colorPicker.setAttribute("list", "")
document.body.appendChild(colorPicker)

function setColorPickerStyleAndAction() {
    colorPicker.style.display = "none"
    colorPicker.style.color = "transparent"
    colorPicker.style.backgroundColor = "transparent"
    colorPicker.style.border = "0px solid transparent"
    colorPicker.style.position = "absolute"
    colorPicker.style.left = `-10px`
    colorPicker.style.top = `-10px`
    colorPicker.style.width = "1px"
    colorPicker.style.height = "1px"
    colorPicker.style.display = "block"
    colorPicker.style.zIndex = "-1"
}

function callColorPicker(state: EditorState, dispatch: any, view: EditorView, event: Event): boolean {
    colorPicker.style.left = `${(event as MouseEvent).clientX}px`
    colorPicker.style.top = `${(event as MouseEvent).clientY}px`
    colorPicker.onchange = () => { fontColorHandler(state, dispatch, view) }

    colorPicker.focus()
    colorPicker.click()

    return true
}

function callBackgroundColorPicker(state: EditorState, dispatch: any, view: EditorView, event: Event): boolean {
    colorPicker.style.left = `${(event as MouseEvent).clientX}px`
    colorPicker.style.top = `${(event as MouseEvent).clientY}px`
    colorPicker.onchange = () => { backgroundColorHandler(state, dispatch, view) }

    colorPicker.focus()
    colorPicker.click()

    return true
}

function fontColorHandler(state: EditorState, dispatch: any, view: EditorView) {
    const attrs = { fontColor: colorPicker.value }

    setMarkFontStyle(fontStyleMarkType, attrs)(state, dispatch)
}

function backgroundColorHandler(state: EditorState, dispatch: any, view: EditorView) {
    const attrs = { backgroundColor: colorPicker.value }

    setMarkFontStyle(fontStyleMarkType, attrs)(state, dispatch)
}

function getColorPickerMenuItem(markType: MarkType) {
    fontStyleMarkType = markType

    setColorPickerStyleAndAction()

    const menuItem = {
        title: "Set font color",
        icon: setIconElement("icon-text-color"),
        run: callColorPicker
    }

    return new MenuItem(menuItem)
}

function getBackgroundColorPickerMenuItem(markType: MarkType) {
    fontStyleMarkType = markType

    setColorPickerStyleAndAction()

    const menuItem = {
        title: "Set font color",
        icon: setIconElement("icon-text-bg"),
        run: callBackgroundColorPicker
    }

    return new MenuItem(menuItem)
}

function getFontStyleAttr(dom: HTMLElement): false | Attrs | null {
    return {
        fontSize: parseInt((dom as HTMLElement).style.fontSize.replace("pt", "")),
        fontColor: (dom as HTMLElement).style.color,
        backgroundColor: (dom as HTMLElement).style.backgroundColor
    }
}

function SetFontStyleSchemaMark(marks: OrderedMap<MarkSpec>): OrderedMap<MarkSpec> {
    const fontSizeMarkSpec: MarkSpec = {
        attrs: {
            fontSize: { default: null },
            fontColor: { default: null },
            backgroundColor: { default: null }
        },
        inclusive: true,
        parseDOM: [{ tag: "span", style: "font-size;color;background-color;", getAttrs(dom) { return getFontStyleAttr(dom as HTMLElement) } }],
        toDOM(m) {
            return ["span", {
                style: `
                font-size: ${m.attrs.fontSize}pt;
                color: ${(m.attrs.fontColor) ? m.attrs.fontColor : null};
                background-color: ${(m.attrs.backgroundColor) ? m.attrs.backgroundColor : null};
                `
            }, 0]
        }
    }

    marks = marks.addToEnd(`fontstyle`, fontSizeMarkSpec)

    return marks
}

// https://prosemirror.net/examples/tooltip
function fontStyleContextMenuHandler() {
    const plugin = new Plugin({
        props: {
            handleDOMEvents: {
                mouseup: function (view: EditorView, event: MouseEvent,): void {
                    switch (event.button) {
                        case 0: // Left mouse button
                            break
                        case 1: // Wheel button
                            break
                        case 2: // Right mouse button
                            break
                    }
                },
                mousedown: function (view: EditorView, event: MouseEvent,): void {
                    if (event.button > 1) { return }

                    const editorContainer = view.dom.parentElement?.parentElement as HTMLElement
                    const root = view.dom
                    let node = (event.target as HTMLElement)

                    let fontSize = node.style.fontSize
                    if (!fontSize) {
                        const px = parseInt(globalThis.getComputedStyle(node).fontSize.replace("px", ""))
                        fontSize = `${px * 3 / 4}pt`
                    }

                    console.log("font size / node:", fontSize, node)
                }
            }
        }
    })

    return plugin
}

export {
    getColorPickerMenuItem, getBackgroundColorPickerMenuItem,
    FontSizeList, SetFontStyleSchemaMark,
    fontStyleContextMenuHandler
}