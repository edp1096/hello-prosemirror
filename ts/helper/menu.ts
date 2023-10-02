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
    for (let prop in options) (passedOptions as any)[prop] = (options as any)[prop]
    if (!options.enable && !options.select)
        passedOptions[options.enable ? "enable" : "select"] = state => cmd(state)

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
    toggleStrong?: MenuItem /// A menu item to toggle the [strong mark](#schema-basic.StrongMark).
    toggleEm?: MenuItem /// A menu item to toggle the [emphasis mark](#schema-basic.EmMark).
    toggleCode?: MenuItem /// A menu item to toggle the [code font mark](#schema-basic.CodeMark).
    toggleLink?: MenuItem /// A menu item to toggle the [link mark](#schema-basic.LinkMark).
    insertImage?: MenuItem /// A menu item to insert an [image](#schema-basic.Image).
    wrapBulletList?: MenuItem /// A menu item to wrap the selection in a [bullet list](#schema-list.BulletList).
    wrapOrderedList?: MenuItem /// A menu item to wrap the selection in an [ordered list](#schema-list.OrderedList).
    wrapBlockQuote?: MenuItem /// A menu item to wrap the selection in a [block quote](#schema-basic.BlockQuote).
    makeParagraph?: MenuItem /// A menu item to set the current textblock to be a normal [paragraph](#schema-basic.Paragraph).
    makeCodeBlock?: MenuItem /// A menu item to set the current textblock to be a [code block](#schema-basic.CodeBlock).

    /// Menu items to set the current textblock to be a [heading](#schema-basic.Heading) of level _N_.
    makeHead1?: MenuItem
    makeHead2?: MenuItem
    makeHead3?: MenuItem
    makeHead4?: MenuItem
    makeHead5?: MenuItem
    makeHead6?: MenuItem

    insertHorizontalRule?: MenuItem /// A menu item to insert a horizontal rule.
    insertMenu: Dropdown /// A dropdown containing the `insertImage` and `insertHorizontalRule` items.
    typeMenu: Dropdown /// A dropdown containing the items for making the current textblock a paragraph, code block, or heading.
    blockMenu: MenuElement[][] /// Array of block-related menu items.
    inlineMenu: MenuElement[][] /// Inline-markup related menu items.

    /// An array of arrays of menu elements for use as the full menu
    /// for, for example the [menu bar](https://github.com/prosemirror/prosemirror-menu#user-content-menubar).
    fullMenu: MenuElement[][]
}

/// Given a schema, look for default mark and node types in it and
/// return an object with relevant menu items relating to those marks.
export function buildMenuItems(schema: Schema): MenuItemResult {
    icons.bold = setIconElement("bi-type-bold")
    icons.italic = setIconElement("bi-type-italic")
    icons.code = setIconElement("bi-code")
    icons.link = setIconElement("bi-link-45deg")
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

    if (mark = schema.marks.strong) { r.toggleStrong = markItem(mark, { title: "Toggle strong style", icon: icons.bold }) }
    if (mark = schema.marks.em) { r.toggleEm = markItem(mark, { title: "Toggle emphasis", icon: icons.italic }) }
    if (mark = schema.marks.code) { r.toggleCode = markItem(mark, { title: "Toggle code font", icon: icons.code }) }
    if (mark = schema.marks.link) { r.toggleLink = linkItem(mark) }

    let node: NodeType | undefined
    if (node = schema.nodes.image) { r.insertImage = insertImageItem(node) }
    if (node = schema.nodes.bullet_list) {
        r.wrapBulletList = wrapListItem(node, { title: "Wrap in bullet list", icon: icons.bulletList })
    }
    if (node = schema.nodes.ordered_list) {
        r.wrapOrderedList = wrapListItem(node, { title: "Wrap in ordered list", icon: icons.orderedList })
    }
    if (node = schema.nodes.blockquote) {
        r.wrapBlockQuote = wrapItem(node, { title: "Wrap in block quote", icon: icons.blockquote })
    }
    if (node = schema.nodes.paragraph) {
        r.makeParagraph = blockTypeItem(node, { title: "Change to paragraph", label: "Plain" })
    }
    if (node = schema.nodes.code_block) {
        r.makeCodeBlock = blockTypeItem(node, { title: "Change to code block", label: "Code" })
    }
    if (node = schema.nodes.heading) {
        for (let i = 1; i <= 10; i++) {
            (r as any)["makeHead" + i] = blockTypeItem(node, {
                title: "Change to heading " + i,
                label: "Level " + i,
                attrs: { level: i }
            })
        }
    }
    if (node = schema.nodes.horizontal_rule) {
        let hr = node
        r.insertHorizontalRule = new MenuItem({
            title: "Insert horizontal rule",
            label: "Horizontal rule",
            enable(state) { return canInsert(state, hr) },
            run(state, dispatch) { dispatch(state.tr.replaceSelectionWith(hr.create())) }
        })
    }

    const undoItem = new MenuItem({ title: "Undo last change", run: undo, enable: state => undo(state), icon: icons.undo })
    const redoItem = new MenuItem({ title: "Redo last undone change", run: redo, enable: state => redo(state), icon: icons.redo })
    const outdentItem = new MenuItem({ title: "Lift out of enclosing block", run: lift, select: state => lift(state), icon: icons.outdent })
    // TODO: join up -> shift + enter support
    const joinUpItem = new MenuItem({ title: "Join with above block", run: joinUp, select: state => joinUp(state), icon: icons.paragraph })

    let cut = <T>(arr: T[]) => arr.filter(x => x) as NonNullable<T>[]

    r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule]), { label: "Insert" })
    r.typeMenu = new Dropdown(
        cut([
            r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new DropdownSubmenu(
                cut([
                    r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
                ]), { label: "Heading" }
            )
        ]), { label: "Type..." }
    )

    r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink])]
    r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem, outdentItem, selectParentNodeItem])]

    const menuTable = [getTableMenus()]
    const menuWebvideo = [getYoutubeMenus()]

    r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[undoItem, redoItem]], r.blockMenu, menuWebvideo, menuTable)

    return r
}