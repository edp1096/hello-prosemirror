import {
    wrapItem, blockTypeItem, Dropdown, DropdownSubmenu,
    selectParentNodeItem, icons, IconSpec, MenuItem, MenuElement, MenuItemSpec
} from "prosemirror-menu"
import { Schema, Attrs, Node, NodeType, MarkSpec, MarkType } from "prosemirror-model"
import { NodeSelection, EditorState, TextSelection, SelectionRange, Command, Transaction } from "prosemirror-state"
import { toggleMark, lift, joinUp } from "prosemirror-commands"
import { undo, redo } from "prosemirror-history"
import { wrapInList } from "prosemirror-schema-list"

import { TextField, openPrompt } from "./prompt"
import { AlignmentDefinitions, SetAlignSchemaNode } from "./alignment"
import { FontSizeList } from "./textstyle"
import { getImageUploadMenus } from "./upload"
import { getYoutubeMenus } from "./youtube"
import { getTableMenus } from "./table"
import {
    setIconElement,
    canInsert, insertImageItem,
    markItem, linkItem, wrapListItem,
    markItemWithAttrsAndNoneActive,
    setMark,
    wrapItemMy, blockTypeItemMy
} from "./utils"


function buildMenuItems(schema: Schema): MenuElement[][] {
    const itemsFontSize: MenuItem[] = new Array<MenuItem>;
    const fontSizeList = FontSizeList

    if (schema.marks.fontsize) {
        for (let i = 0; i < fontSizeList.length; i++) {
            itemsFontSize.push(markItemWithAttrsAndNoneActive(schema.marks.fontsize, { title: `Set font size to ${fontSizeList[i]}pt`, label: `${fontSizeList[i]}pt`, attrs: { fontSize: `${fontSizeList[i]}` } }))
        }
    }

    const itemToggleStrong = (schema.marks.strong) ? markItem(schema.marks.strong, { title: "Toggle strong style", icon: setIconElement("bi-type-bold") }) : undefined
    const itemToggleEM = (schema.marks.em) ? markItem(schema.marks.em, { title: "Toggle emphasis", icon: setIconElement("bi-type-italic") }) : undefined
    const itemToggleStrike = (schema.marks.strike) ? markItem(schema.marks.strike, { title: "Toggle strike", icon: setIconElement("bi-type-strikethrough") }) : undefined
    const itemToggleUnderline = (schema.marks.underline) ? markItem(schema.marks.underline, { title: "Toggle underline", icon: setIconElement("bi-type-underline") }) : undefined
    const itemToggleCode = (schema.marks.code) ? markItem(schema.marks.code, { title: "Toggle code font", icon: setIconElement("bi-code") }) : undefined
    const itemToggleLink = (schema.marks.link) ? linkItem(schema.marks.link, setIconElement("bi-link-45deg")) : undefined

    const itemsAlign: MenuItem[] = []
    if (schema.nodes.alignment) {
        for (let align of AlignmentDefinitions) {
            itemsAlign.push(wrapItemMy(schema.nodes.alignment, { title: `Align ${align.direction}`, icon: setIconElement(align.icon_name), attrs: { alignment: align.direction } }))
            // itemsAlign.push(blockTypeItemMy(schema.nodes.alignment, { title: `Align ${align.direction}`, icon: setIconElement(align.icon_name), attrs: { alignment: align.direction } }))
        }
    }

    const itemLineSetPlain = (schema.nodes.paragraph) ? blockTypeItem(schema.nodes.paragraph, { title: "Change to plain text", label: "Plain", icon: setIconElement("bi-type") }) : undefined
    const itemLineSetCode = (schema.nodes.code_block) ? blockTypeItem(schema.nodes.code_block, { title: "Change to code block", label: "Code", icon: setIconElement("bi-code-slash") }) : undefined
    const itemsHeading: MenuItem[] = new Array<MenuItem>;
    if (schema.nodes.heading) {
        for (let i = 1; i <= 6; i++) {
            itemsHeading.push(blockTypeItem(schema.nodes.heading, { title: "Change to heading " + i, label: "H" + i, attrs: { level: i } }))
        }
    }

    const itemUndo = new MenuItem({ title: "Undo last change", run: undo, enable: state => undo(state), icon: setIconElement("bi-arrow-counterclockwise") })
    const itemRedo = new MenuItem({ title: "Redo last undone change", run: redo, enable: state => redo(state), icon: setIconElement("bi-arrow-clockwise") })

    const itemInsertHR = (schema.nodes.horizontal_rule) ? new MenuItem({
        title: "Insert horizontal rule",
        label: "Horizontal rule",
        icon: setIconElement("bi-hr"),
        enable(state) { return canInsert(state, schema.nodes.horizontal_rule) },
        run(state, dispatch) { dispatch(state.tr.replaceSelectionWith(schema.nodes.horizontal_rule.create())) }
    }) : undefined
    const itemInsertTable = getTableMenus()
    const itemInsertImage = (schema.nodes.image) ? insertImageItem(schema.nodes.image) : undefined
    const itemUploadImage = getImageUploadMenus()
    const itemInsertYoutube = getYoutubeMenus()

    const itemBulletList = (schema.nodes.bullet_list) ? wrapListItem(schema.nodes.bullet_list, { title: "Wrap in bullet list", icon: setIconElement("bi-list-ul") }) : undefined
    const itemOrderedList = (schema.nodes.ordered_list) ? wrapListItem(schema.nodes.ordered_list, { title: "Wrap in ordered list", icon: setIconElement("bi-list-ol") }) : undefined
    const itemBlockQuote = (schema.nodes.blockquote) ? wrapItem(schema.nodes.blockquote, { title: "Wrap in block quote", icon: setIconElement("bi-quote") }) : undefined
    // TODO: join up -> Key event "shift + enter" support
    const itemJoinUp = new MenuItem({ title: "Join with above block", run: joinUp, select: state => joinUp(state), icon: setIconElement("bi-text-paragraph") })
    const itemOutdent = new MenuItem({ title: "Lift out of enclosing block", run: lift, select: state => lift(state), icon: setIconElement("bi-text-indent-right") })

    const cut = <T>(arr: T[]) => arr.filter(x => x) as NonNullable<T>[]

    const menuInline: MenuElement[][] = [cut([
        new Dropdown(cut(itemsFontSize), { title: "Set font size", label: "Aa" }),
        itemToggleStrong, itemToggleEM, itemToggleStrike, itemToggleUnderline, itemToggleCode, itemToggleLink,
        ...itemsAlign
    ])]
    const menuLineType = cut([itemLineSetPlain, itemLineSetCode, new Dropdown(cut(itemsHeading), { label: "H1" })])
    const menuHistory = [itemUndo, itemRedo]
    const menuInsertUpload = cut([
        itemInsertHR, itemInsertTable,
        itemInsertImage, itemUploadImage,
        itemInsertYoutube
    ])
    const menuBlock = cut([
        itemBulletList, itemOrderedList, itemBlockQuote,
        itemJoinUp, itemOutdent, selectParentNodeItem
    ])

    const result = menuInline.concat([menuLineType], [menuHistory], [menuInsertUpload], [menuBlock])

    return result
}

export { buildMenuItems }