// import {
//     wrapItem, blockTypeItem, Dropdown, DropdownSubmenu,
//     selectParentNodeItem, icons, IconSpec, MenuItem, MenuElement, MenuItemSpec
// } from "prosemirror-menu"
import {
    wrapItem, blockTypeItem, Dropdown, DropdownSubmenu,
    selectParentNodeItem, icons, IconSpec, MenuItem, MenuElement, MenuItemSpec
} from "../pkgs/menu"
import { Schema } from "prosemirror-model"
import { lift, joinUp } from "prosemirror-commands"
import { undo, redo } from "prosemirror-history"

import { AlignmentDefinitions } from "./alignment"
import { getColorPickerMenuItem, getBackgroundColorPickerMenuItem, FontSizeList } from "./textstyle"
import { getImageUploadMenus } from "./upload"
import { getYoutubeMenus } from "./youtube"
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

function buildMenuItems(schema: Schema): MenuElement[][] {
    const fontSizeList = FontSizeList
    const itemsFontSize: MenuItem[] = new Array<MenuItem>;

    if (schema.marks.fontstyle) {
        for (let i = 0; i < fontSizeList.length; i++) {
            itemsFontSize.push(markItemFontSize(schema.marks.fontstyle, { title: `Set font size to ${fontSizeList[i]}pt`, label: `${fontSizeList[i]}pt`, attrs: { fontSize: `${fontSizeList[i]}` } }))
        }
    }

    itemTextSizeDropdown = (schema.marks.fontstyle) ? new Dropdown(cut(itemsFontSize), { title: "Set font size", label: "Aa" }) : undefined

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
    const itemsHeading: MenuItem[] = new Array<MenuItem>;
    if (schema.nodes.heading) {
        for (let i = 1; i <= 6; i++) {
            itemsHeading.push(blockTypeItem(schema.nodes.heading, { title: "Change to heading " + i, label: "H" + i, attrs: { level: i } }))
        }
    }

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
    const itemInsertYoutube = getYoutubeMenus()

    const itemBulletList = (schema.nodes.bullet_list) ? wrapListItem(schema.nodes.bullet_list, { title: "Wrap in bullet list", icon: setIconElement("icon-list-bullet") }) : undefined
    const itemOrderedList = (schema.nodes.ordered_list) ? wrapListItem(schema.nodes.ordered_list, { title: "Wrap in ordered list", icon: setIconElement("icon-list-numbered") }) : undefined
    const itemBlockQuote = (schema.nodes.blockquote) ? wrapItem(schema.nodes.blockquote, { title: "Wrap in block quote", icon: setIconElement("icon-quote-right") }) : undefined
    // TODO: join up -> Key event "shift + enter" support
    const itemJoinUp = new MenuItem({ title: "Join with above block", run: joinUp, select: state => joinUp(state), icon: setIconElement("icon-call-merge") })
    const itemOutdent = new MenuItem({ title: "Lift out of enclosing block", run: lift, select: state => lift(state), icon: setIconElement("icon-indent-left") })

    const menuInline: MenuElement[][] = [cut([])]
    // const menuInline: MenuElement[][] = [cut([
    //     itemTextSizeDropdown, itemFontColor, itemFontBackgroundColor,
    //     itemToggleStrong, itemToggleEM, itemToggleStrike, itemToggleUnderline, itemToggleCode, itemToggleLink
    // ])]

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
        itemInsertYoutube
    ])
    const menuBlock = cut([
        itemLineSetCode,
        new Dropdown(cut(itemsHeading), { label: "H1" }),
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