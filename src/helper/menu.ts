import {
    wrapItem, blockTypeItem, Dropdown, DropdownSubmenu,
    selectParentNodeItem, icons, IconSpec, MenuItem, MenuElement, MenuItemSpec
} from "prosemirror-menu"
import { undo, redo } from "prosemirror-history"
import { NodeSelection, EditorState, Command } from "prosemirror-state"
import { Schema, NodeType, MarkType } from "prosemirror-model"
import { toggleMark, lift, joinUp } from "prosemirror-commands"
import { wrapInList } from "prosemirror-schema-list"
import { TextField, openPrompt } from "./prompt"
import { getYoutubeMenus } from "./youtube"
import { getImageUploadMenus } from "./upload"
import { getTableMenus } from "./table"
import { setIconElement } from "./utils"


function canInsert(state: EditorState, nodeType: NodeType) {
    let $from = state.selection.$from
    for (let d = $from.depth; d >= 0; d--) {
        let index = $from.index(d)
        if ($from.node(d).canReplaceWith(index, index, nodeType)) return true
    }

    return false
}

function insertImageItem(nodeType: NodeType) {
    return new MenuItem({
        title: "Insert image",
        label: "Image",
        icon: setIconElement("bi-image"),
        enable(state) { return canInsert(state, nodeType) },
        run(state, _, view) {
            let { from, to } = state.selection, attrs = null
            if (state.selection instanceof NodeSelection && state.selection.node.type == nodeType)
                attrs = state.selection.node.attrs
            openPrompt({
                title: "Insert image",
                fields: {
                    src: new TextField({ label: "Location", required: true, value: attrs && attrs.src }),
                    title: new TextField({ label: "Title", value: attrs && attrs.title }),
                    alt: new TextField({
                        label: "Description",
                        value: attrs ? attrs.alt : state.doc.textBetween(from, to, " ")
                    })
                },
                callback(attrs) {
                    view.dispatch(view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs)!))
                    view.focus()
                }
            })
        }
    })
}

function cmdItem(cmd: Command, options: Partial<MenuItemSpec>) {
    let passedOptions: MenuItemSpec = {
        label: options.title as string | undefined,
        run: cmd
    }
    for (let prop in options) {
        (passedOptions as any)[prop] = (options as any)[prop]
    }
    if (!options.enable && !options.select) {
        passedOptions[options.enable ? "enable" : "select"] = state => cmd(state)
    }

    return new MenuItem(passedOptions)
}

function markActive(state: EditorState, type: MarkType) {
    let { from, $from, to, empty } = state.selection
    if (empty) return !!type.isInSet(state.storedMarks || $from.marks())
    else return state.doc.rangeHasMark(from, to, type)
}

function markItem(markType: MarkType, options: Partial<MenuItemSpec>) {
    let passedOptions: Partial<MenuItemSpec> = {
        active(state) { return markActive(state, markType) }
    }
    for (let prop in options) (passedOptions as any)[prop] = (options as any)[prop]
    return cmdItem(toggleMark(markType), passedOptions)
}

function linkItem(markType: MarkType) {
    return new MenuItem({
        title: "Add or remove link",
        icon: icons.link,
        active(state) { return markActive(state, markType) },
        enable(state) { return !state.selection.empty },
        run(state, dispatch, view) {
            if (markActive(state, markType)) {
                toggleMark(markType)(state, dispatch)
                return true
            }
            openPrompt({
                title: "Create a link",
                fields: {
                    href: new TextField({
                        label: "Link target",
                        required: true
                    }),
                    title: new TextField({ label: "Title" })
                },
                callback(attrs) {
                    toggleMark(markType, attrs)(view.state, view.dispatch)
                    view.focus()
                }
            })
        }
    })
}

function wrapListItem(nodeType: NodeType, options: Partial<MenuItemSpec>) {
    return cmdItem(wrapInList(nodeType, (options as any).attrs), options)
}

type MenuItemResult = {
    wrapBulletList?: MenuItem /// A menu item to wrap the selection in a [bullet list](#schema-list.BulletList).
    wrapOrderedList?: MenuItem /// A menu item to wrap the selection in an [ordered list](#schema-list.OrderedList).
    wrapBlockQuote?: MenuItem /// A menu item to wrap the selection in a [block quote](#schema-basic.BlockQuote).

    /// Menu items to set the current textblock to be a [heading](#schema-basic.Heading) of level _N_.
    makeHead1?: MenuItem
    makeHead2?: MenuItem
    makeHead3?: MenuItem
    makeHead4?: MenuItem
    makeHead5?: MenuItem
    makeHead6?: MenuItem
}

function buildMenuItems(schema: Schema): MenuElement[][] {
    icons.bold = setIconElement("bi-type-bold")
    icons.italic = setIconElement("bi-type-italic")
    icons.code = setIconElement("bi-code")
    icons.link = setIconElement("bi-link-45deg")
    icons.textPlain = setIconElement("bi-type")
    icons.textCode = setIconElement("bi-code")
    icons.bulletList = setIconElement("bi-list-ul")
    icons.orderedList = setIconElement("bi-list-ol")
    icons.blockquote = setIconElement("bi-quote")
    icons.undo = setIconElement("bi-arrow-counterclockwise")
    icons.redo = setIconElement("bi-arrow-clockwise")
    icons.outdent = setIconElement("bi-text-indent-right")
    icons.paragraph = setIconElement("bi-text-paragraph")
    icons.upload = setIconElement("bi-upload")

    const uploadEL = document.createElement("input")
    uploadEL.setAttribute("type", "file")
    uploadEL.setAttribute("multiple", "")

    let r: MenuItemResult = {} as any
    let mark: MarkType | undefined

    let itemToggleStrong, itemToggleEM, itemToggleCode, itemToggleLink
    let itemInsertImage, itemInsertHR
    let itemLineSetPlain, itemLineSetCode

    if (mark = schema.marks.strong) { itemToggleStrong = markItem(mark, { title: "Toggle strong style", icon: icons.bold }) }
    if (mark = schema.marks.em) { itemToggleEM = markItem(mark, { title: "Toggle emphasis", icon: icons.italic }) }
    if (mark = schema.marks.code) { itemToggleCode = markItem(mark, { title: "Toggle code font", icon: icons.code }) }
    if (mark = schema.marks.link) { itemToggleLink = linkItem(mark) }

    let node: NodeType | undefined

    if (node = schema.nodes.image) {
        itemInsertImage = insertImageItem(node)
    }
    if (node = schema.nodes.horizontal_rule) {
        let hr = node // variable node not work so, copy it
        itemInsertHR = new MenuItem({
            title: "Insert horizontal rule",
            label: "Horizontal rule",
            icon: setIconElement("bi-hr"),
            enable(state) { return canInsert(state, hr) },
            run(state, dispatch) { dispatch(state.tr.replaceSelectionWith(hr.create())) }
        })
    }
    if (node = schema.nodes.paragraph) {
        itemLineSetPlain = blockTypeItem(node, { title: "Change to plain text", label: "Plain", icon: icons.textPlain })
    }
    if (node = schema.nodes.code_block) {
        itemLineSetCode = blockTypeItem(node, { title: "Change to code block", label: "Code", icon: icons.textCode })
    }
    if (node = schema.nodes.heading) {
        for (let i = 1; i <= 10; i++) {
            (r as any)["makeHead" + i] = blockTypeItem(node, {
                title: "Change to heading " + i,
                label: "H" + i,
                attrs: { level: i }
            })
        }
    }
    if (node = schema.nodes.bullet_list) {
        r.wrapBulletList = wrapListItem(node, { title: "Wrap in bullet list", icon: icons.bulletList })
    }
    if (node = schema.nodes.ordered_list) {
        r.wrapOrderedList = wrapListItem(node, { title: "Wrap in ordered list", icon: icons.orderedList })
    }
    if (node = schema.nodes.blockquote) {
        r.wrapBlockQuote = wrapItem(node, { title: "Wrap in block quote", icon: icons.blockquote })
    }

    const outdentItem = new MenuItem({ title: "Lift out of enclosing block", run: lift, select: state => lift(state), icon: icons.outdent })
    // TODO: join up -> shift + enter support
    const joinUpItem = new MenuItem({ title: "Join with above block", run: joinUp, select: state => joinUp(state), icon: icons.paragraph })

    let cut = <T>(arr: T[]) => arr.filter(x => x) as NonNullable<T>[]

    const menuInsert = cut([itemInsertImage, itemInsertHR])
    const menuTypes = cut([
        itemLineSetPlain, // line as plain
        itemLineSetCode, // line as code
        r.makeHead1 && new Dropdown(cut([
            r.makeHead1,
            r.makeHead2,
            r.makeHead3,
            r.makeHead4,
            r.makeHead5,
            r.makeHead6
        ]), { label: "H1" }) // line as heading
    ])

    const undoItem = new MenuItem({ title: "Undo last change", run: undo, enable: state => undo(state), icon: icons.undo })
    const redoItem = new MenuItem({ title: "Redo last undone change", run: redo, enable: state => redo(state), icon: icons.redo })
    const menuHistory = [undoItem, redoItem]

    const menuTable = getTableMenus()
    const menuUpload = getImageUploadMenus()
    const menuWebvideo = getYoutubeMenus()

    const menuInline: MenuElement[][] = [cut([itemToggleStrong, itemToggleEM, itemToggleCode, itemToggleLink])]
    const menuBlock = cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem, outdentItem, selectParentNodeItem])

    const result = menuInline.concat(
        [menuTypes],
        [menuHistory],
        [menuTable],
        [menuInsert, menuUpload, menuWebvideo],
        [menuBlock]
    )

    return result
}

export { buildMenuItems }