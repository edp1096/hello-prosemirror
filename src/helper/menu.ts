// import {
//     wrapItem, blockTypeItem, Dropdown, DropdownSubmenu,
//     selectParentNodeItem, icons, IconSpec, MenuItem, MenuElement, MenuItemSpec
// } from "prosemirror-menu"
import {
    wrapItem, blockTypeItem, Dropdown, DropdownSubmenu,
    selectParentNodeItem, icons, IconSpec, MenuItem, MenuElement, MenuItemSpec
} from "../pkgs/menu"
import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema, NodeType } from "prosemirror-model"
import { lift, joinUp } from "prosemirror-commands"
import { undo, redo } from "prosemirror-history"

import { AlignmentDefinitions } from "./alignment"
import { getColorPickerMenuItem, getBackgroundColorPickerMenuItem, FontSizeList } from "./textstyle"
import { getImageUploadMenus } from "./upload"
import { getVideoServiceMenus } from "./video-service"
import { getTableMenus } from "./table"
import {
    setIconElement,
    canInsert, insertImageItem,
    markItem, linkItem, wrapListItem,
    markItemFontSize,
    AlignItemMy
} from "./utils"


const cut = <T>(arr: T[]) => arr.filter(x => x) as NonNullable<T>[]
let itemTextSizeDropdown

function getCurrentFontSize(state: EditorState): string {
    const { from, to } = state.selection
    let fontSize = ''
    state.doc.nodesBetween(from, to, (node) => {
        if (node.marks.length > 0) {
            const fontSizeMark = node.marks.find(mark => mark.type.name == 'fontstyle')
            if (fontSizeMark && fontSizeMark.attrs.fontSize) {
                fontSize = fontSizeMark.attrs.fontSize
                return false
            }
        }
        return true
    })
    return fontSize
}

function createFontSizeDropdown(schema: Schema, fontSizeList: number[]): Dropdown | undefined {
    if (!schema.marks.fontstyle) { return undefined }

    const itemsFontSize = fontSizeList.map(size =>
        markItemFontSize(schema.marks.fontstyle, {
            title: `Set font size to ${size}pt`,
            label: `${size}pt`,
            attrs: { fontSize: size }
        })
    )

    const dropdown = new Dropdown(itemsFontSize, { title: "Set font size", label: "Aa" })

    const originalRender = dropdown.render.bind(dropdown)
    dropdown.render = (view: EditorView) => {
        const renderResult = originalRender(view)
        const originalUpdate = renderResult.update

        renderResult.update = (state: EditorState) => {
            const currentSize = getCurrentFontSize(state)
            const label = currentSize ? `${currentSize}pt` : "Aa"

            const fontSizeSelector = 'div[title="Set font size"]'
            const labelElement = renderResult.dom.querySelector(fontSizeSelector)
            if (labelElement) {
                labelElement.textContent = label
            }

            return originalUpdate(state)
        }

        return renderResult
    }

    return dropdown
}

function getCurrentHeadingLevel(state: EditorState): number | null {
    const $head = state.selection.$head
    for (let d = $head.depth; d > 0; d--) {
        const node = $head.node(d)
        if (node.type.name === 'heading') {
            return node.attrs.level
        }
    }
    return null
}

function createHeadingDropdown(schema: Schema): Dropdown | undefined {
    if (!schema.nodes.heading) return undefined

    const items = []
    for (let i = 1; i <= 6; i++) {
        items.push(blockTypeItem(schema.nodes.heading, {
            title: `Change to heading ${i}`,
            label: `H${i}`,
            attrs: { level: i }
        }))
    }

    const dropdown = new Dropdown(items, { title: "Change heading level", label: "H" })

    const originalRender = dropdown.render.bind(dropdown)
    dropdown.render = (view: EditorView) => {
        const renderResult = originalRender(view)
        const originalUpdate = renderResult.update

        renderResult.update = (state: EditorState) => {
            const hasFocus = view.hasFocus()
            const currentLevel = getCurrentHeadingLevel(state)
            const label = (hasFocus && currentLevel) ? `H${currentLevel}` : "H"

            const headingSelector = 'div[title="Change heading level"]'
            const labelElement = renderResult.dom.querySelector(headingSelector)
            if (labelElement) {
                labelElement.textContent = label
            }

            return originalUpdate(state)
        }

        return renderResult
    }

    return dropdown
}

function buildMenuItems(schema: Schema): MenuElement[][] {
    const fontSizeList = FontSizeList
    const itemsFontSize: MenuItem[] = new Array<MenuItem>;

    if (schema.marks.fontstyle) {
        for (let i = 0; i < fontSizeList.length; i++) {
            itemsFontSize.push(markItemFontSize(schema.marks.fontstyle, { title: `Set font size to ${fontSizeList[i]}pt`, label: `${fontSizeList[i]}pt`, attrs: { fontSize: `${fontSizeList[i]}` } }))
        }
    }

    // itemTextSizeDropdown = (schema.marks.fontstyle) ? new Dropdown(cut(itemsFontSize), { title: "Set font size", label: "Aa" }) : undefined
    itemTextSizeDropdown = createFontSizeDropdown(schema, fontSizeList)

    const itemFontColor = (schema.marks.fontstyle) ? getColorPickerMenuItem(schema.marks.fontstyle) : undefined
    const itemFontBackgroundColor = (schema.marks.fontstyle) ? getBackgroundColorPickerMenuItem(schema.marks.fontstyle) : undefined

    const itemToggleStrong = (schema.marks.strong) ? markItem(schema.marks.strong, { title: "Toggle strong style", icon: setIconElement("icon-bold") }) : undefined
    const itemToggleEM = (schema.marks.em) ? markItem(schema.marks.em, { title: "Toggle emphasis", icon: setIconElement("icon-italic") }) : undefined
    const itemToggleStrike = (schema.marks.strike) ? markItem(schema.marks.strike, { title: "Toggle strike", icon: setIconElement("icon-strike") }) : undefined
    const itemToggleUnderline = (schema.marks.underline) ? markItem(schema.marks.underline, { title: "Toggle underline", icon: setIconElement("icon-underline") }) : undefined
    const itemToggleCode = (schema.marks.code) ? markItem(schema.marks.code, { title: "Toggle code font", icon: setIconElement("icon-code-1") }) : undefined
    const itemToggleLink = (schema.marks.link) ? linkItem(schema.marks.link, setIconElement("icon-link")) : undefined

    const itemsAlign: MenuItem[] = []
    if (schema.nodes.alignment) {
        for (let align of AlignmentDefinitions) {
            itemsAlign.push(AlignItemMy(schema.nodes.alignment, { title: `Align ${align.direction}`, icon: setIconElement(align.icon_name), attrs: { alignment: align.direction } }))
        }
    }

    // Give up to make to seek both paragraph and alignment("p") as same status
    const itemLineSetPlain = (schema.nodes.paragraph) ? blockTypeItem(schema.nodes.paragraph, { title: "Change to plain text", label: "Aa", icon: setIconElement("icon-fontsize") }) : undefined
    const itemLineSetCode = (schema.nodes.code_block) ? blockTypeItem(schema.nodes.code_block, { title: "Change to code block", label: "Code", icon: setIconElement("icon-code") }) : undefined
    // const itemsHeading: MenuItem[] = new Array<MenuItem>;
    // if (schema.nodes.heading) {
    //     for (let i = 1; i <= 6; i++) {
    //         itemsHeading.push(blockTypeItem(schema.nodes.heading, { title: "Change to heading " + i, label: "H" + i, attrs: { level: i } }))
    //     }
    // }
    const itemsHeading = createHeadingDropdown(schema)

    const itemUndo = new MenuItem({ title: "Undo last change", run: undo, enable: state => undo(state), icon: setIconElement("icon-undo") })
    const itemRedo = new MenuItem({ title: "Redo last undone change", run: redo, enable: state => redo(state), icon: setIconElement("icon-redo") })

    const itemInsertHR = (schema.nodes.horizontal_rule) ? new MenuItem({
        title: "Insert horizontal rule",
        label: "Horizontal rule",
        icon: setIconElement("icon-minus"),
        enable(state) { return canInsert(state, schema.nodes.horizontal_rule) },
        run(state, dispatch) { dispatch(state.tr.replaceSelectionWith(schema.nodes.horizontal_rule.create())) }
    }) : undefined
    const itemInsertTable = getTableMenus()
    const itemInsertImage = (schema.nodes.image) ? insertImageItem(schema.nodes.image) : undefined
    const itemUploadImage = getImageUploadMenus()
    const itemInsertVideoService = getVideoServiceMenus()

    const itemBulletList = (schema.nodes.bullet_list) ? wrapListItem(schema.nodes.bullet_list, { title: "Wrap in bullet list", icon: setIconElement("icon-list-bullet") }) : undefined
    const itemOrderedList = (schema.nodes.ordered_list) ? wrapListItem(schema.nodes.ordered_list, { title: "Wrap in ordered list", icon: setIconElement("icon-list-numbered") }) : undefined
    const itemBlockQuote = (schema.nodes.blockquote) ? wrapItem(schema.nodes.blockquote, { title: "Wrap in block quote", icon: setIconElement("icon-quote-right") }) : undefined

    // TODO: join up -> Key event "shift + enter" support
    const itemJoinUp = new MenuItem({ title: "Join with above block", run: joinUp, select: state => joinUp(state), icon: setIconElement("icon-call-merge") })
    const itemOutdent = new MenuItem({ title: "Lift out of enclosing block", run: lift, select: state => lift(state), icon: setIconElement("icon-indent-left") })

    const menuInline: MenuElement[][] = [cut([])]

    const menuFontStyle = cut([
        itemTextSizeDropdown, itemFontColor, itemFontBackgroundColor,
        itemToggleStrong, itemToggleEM, itemToggleStrike, itemToggleUnderline,
        itemToggleCode
    ])
    const menuTextLineStyle = cut([
        itemLineSetPlain, ...itemsAlign
    ])
    const menuHistory = [itemUndo, itemRedo]
    const menuInsertUpload = cut([
        itemInsertHR,
        itemToggleLink,
        itemInsertTable,
        itemInsertImage, itemUploadImage,
        itemInsertVideoService
    ])
    const menuBlock = cut([
        itemLineSetCode,
        // new Dropdown(cut(itemsHeading), { label: "H1" }),
        itemsHeading,
        itemBulletList, itemOrderedList, itemBlockQuote,
        itemJoinUp, itemOutdent
    ])

    const result = menuInline.concat(
        [menuHistory],
        [menuFontStyle], [menuTextLineStyle],
        [menuInsertUpload], [menuBlock]
    )

    return result
}

export { buildMenuItems }