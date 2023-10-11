import {
    wrapItem, blockTypeItem, Dropdown, DropdownSubmenu,
    selectParentNodeItem, icons, IconSpec, MenuItem, MenuElement, MenuItemSpec
} from "prosemirror-menu"
import { undo, redo } from "prosemirror-history"
import { NodeSelection, EditorState, TextSelection, SelectionRange, Command, Transaction } from "prosemirror-state"
import { Schema, Attrs, Node, NodeType, MarkType, MarkSpec } from "prosemirror-model"
import { toggleMark, lift, joinUp } from "prosemirror-commands"
import { wrapInList } from "prosemirror-schema-list"

import { TextField, openPrompt } from "./prompt"
import { FontSizeList } from "./textstyle"
import { getImageUploadMenus } from "./upload"
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
    let passedOptions: MenuItemSpec = { label: options.title as string | undefined, run: cmd }
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
    if (empty) {
        return !!type.isInSet(state.storedMarks || $from.marks())
    } else {
        return state.doc.rangeHasMark(from, to, type)
    }
}

function markItem(markType: MarkType, options: Partial<MenuItemSpec>) {
    let passedOptions: Partial<MenuItemSpec> = { active(state) { return markActive(state, markType) } }
    for (let prop in options) {
        (passedOptions as any)[prop] = (options as any)[prop]
    }

    return cmdItem(toggleMark(markType), passedOptions)
}

function markApplies(doc: Node, ranges: SelectionRange[], type: MarkType) {
    for (let i = 0; i < ranges.length; i++) {
        let { $from, $to } = ranges[i];
        let can = $from.depth === 0 ? doc.type.allowsMarkType(type) : false;
        doc.nodesBetween($from.pos, $to.pos, (node) => {
            if (can) return false;
            can = node.inlineContent && node.type.allowsMarkType(type);
        });
        if (can) return true;
    }
    return false;
}

function setMark(markType: MarkType, attrs?: | { [key: string]: any; } | undefined): Command {
    return (state: EditorState, dispatch: ((tr: Transaction) => void) | undefined) => {
        let { empty, $cursor, ranges } = state.selection as TextSelection
        if ((empty && !$cursor) || !markApplies(state.doc, ranges as SelectionRange[], markType)) {
            return false
        }
        if (dispatch) {
            if ($cursor) {
                dispatch(state.tr.addStoredMark(markType.create(attrs)))
            } else {
                let tr = state.tr;
                for (let i = 0; i < ranges.length; i++) {
                    let { $from, $to } = ranges[i];

                    let from = $from.pos,
                        to = $to.pos,
                        start = $from.nodeAfter,
                        end = $to.nodeBefore;
                    let spaceStart =
                        start &&
                            start.isText &&
                            start.text !== null &&
                            start.text !== undefined
                            ? /^\s*/.exec(start.text)?.[0].length ?? 0
                            : 0;
                    let spaceEnd =
                        end && end.isText && end.text !== null && end.text !== undefined
                            ? /\s*$/.exec(end.text)?.[0].length ?? 0
                            : 0;
                    if (from + spaceStart < to) {
                        from += spaceStart;
                        to -= spaceEnd;
                    }
                    tr.addMark(from, to, markType.create(attrs));
                }
                dispatch(tr.scrollIntoView());
            }
        }
        return true;
    };
}

function markItemOverwrite(markType: MarkType, options: Partial<MenuItemSpec>) {
    let passedOptions: Partial<MenuItemSpec> = { active(state) { return markActive(state, markType) } }
    for (let prop in options) {
        (passedOptions as any)[prop] = (options as any)[prop]
    }

    return cmdItem(setMark(markType), passedOptions)
}

function linkItem(markType: MarkType, icon: IconSpec) {
    return new MenuItem({
        title: "Add or remove link",
        icon: icon,
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

function buildMenuItems(schema: Schema): MenuElement[][] {
    const itemsFontSize: MenuItem[] = new Array<MenuItem>;
    const fontSizeList = FontSizeList
    for (let i = 0; i < fontSizeList.length; i++) {
        if (schema.marks[`fontsize${fontSizeList[i]}`]) {
            // itemsFontSize.push(markItem(schema.marks[`fontsize${fontSizeList[i]}`], { title: `Change font ${fontSizeList[i]}pt`, label: `${fontSizeList[i]}pt` }))
            itemsFontSize.push(markItemOverwrite(schema.marks[`fontsize${fontSizeList[i]}`], { title: `Change font ${fontSizeList[i]}pt`, label: `${fontSizeList[i]}pt` }))
        }
    }

    const itemToggleStrong = (schema.marks.strong) ? markItem(schema.marks.strong, { title: "Toggle strong style", icon: setIconElement("bi-type-bold") }) : undefined
    const itemToggleEM = (schema.marks.em) ? markItem(schema.marks.em, { title: "Toggle emphasis", icon: setIconElement("bi-type-italic") }) : undefined
    const itemToggleStrike = (schema.marks.strike) ? markItem(schema.marks.strike, { title: "Toggle strike", icon: setIconElement("bi-type-strikethrough") }) : undefined
    const itemToggleUnderline = (schema.marks.underline) ? markItem(schema.marks.underline, { title: "Toggle underline", icon: setIconElement("bi-type-underline") }) : undefined
    const itemToggleCode = (schema.marks.code) ? markItem(schema.marks.code, { title: "Toggle code font", icon: setIconElement("bi-code") }) : undefined
    const itemToggleLink = (schema.marks.link) ? linkItem(schema.marks.link, setIconElement("bi-link-45deg")) : undefined

    const itemAlignLeft = (schema.nodes.alignleft) ? blockTypeItem(schema.nodes.alignleft, { title: "Align left", icon: setIconElement("bi-text-left") }) : undefined
    const itemAlignCenter = (schema.nodes.aligncenter) ? blockTypeItem(schema.nodes.aligncenter, { title: "Align center", icon: setIconElement("bi-text-center") }) : undefined
    const itemAlignRight = (schema.nodes.alignright) ? blockTypeItem(schema.nodes.alignright, { title: "Align right", icon: setIconElement("bi-text-right") }) : undefined

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
        new Dropdown(cut(itemsFontSize), { label: "Aa" }),
        itemToggleStrong, itemToggleEM, itemToggleStrike, itemToggleUnderline, itemToggleCode, itemToggleLink,
        itemAlignLeft, itemAlignCenter, itemAlignRight,
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