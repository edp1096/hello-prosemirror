import { IconSpec, MenuItem, MenuItemSpec } from "prosemirror-menu"
import { Schema, Node, NodeSpec, NodeType, Mark, MarkSpec, MarkType, Attrs, DOMOutputSpec, Fragment, ParseRule } from "prosemirror-model"
import { NodeSelection, EditorState, TextSelection, SelectionRange, Command, Transaction } from "prosemirror-state"
import { toggleMark, lift, joinUp, wrapIn, setBlockType } from "prosemirror-commands"
import { wrapInList } from "prosemirror-schema-list"

import { TextField, openPrompt } from "./prompt"


function setIconElement(iconName: string): IconSpec {
    const iconEL = document.createElement("i")
    iconEL.setAttribute("class", iconName)
    iconEL.setAttribute("style", "font-size: 1.3em; margin: -0.3em;")

    const result = { dom: iconEL }

    return result
}


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

function markItem(markType: MarkType, options: Object) {
    let passedOptions: Partial<MenuItemSpec> = { active(state) { return markActive(state, markType) } }
    for (let prop in options) {
        (passedOptions as any)[prop] = (options as any)[prop]
    }

    return cmdItem(toggleMark(markType), passedOptions)
}

function markItemWithAttrsAndNoneActive(markType: MarkType, options: Object) {
    const passedOptions: Partial<MenuItemSpec> = { active(state) { return false } }
    for (const prop in options) {
        (passedOptions as any)[prop] = (options as any)[prop]
    }

    return cmdItem(setMark(markType, (passedOptions as any).attrs), passedOptions)
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

// https://codesandbox.io/s/h5e2e?file=/src/commands-extra.ts
/* copy-paste from prosemirror-commands */
function markApplies(doc: Node, ranges: SelectionRange[], type: MarkType) {
    for (let i = 0; i < ranges.length; i++) {
        const { $from, $to } = ranges[i]
        let can = $from.depth === 0 ? doc.type.allowsMarkType(type) : false
        doc.nodesBetween($from.pos, $to.pos, (node) => {
            if (can) { return false }
            can = node.inlineContent && node.type.allowsMarkType(type)
        })

        if (can) { return true }
    }

    return false
}

// https://codesandbox.io/s/h5e2e?file=/src/commands-extra.ts
/* copy-paste of toggleMark but never removes mark */
function setMark(markType: MarkType, attrs?: | { [key: string]: any } | undefined): Command {
    return (state: EditorState, dispatch: ((tr: Transaction) => void) | undefined) => {
        const { empty, $cursor, ranges } = state.selection as TextSelection
        if ((empty && !$cursor) || !markApplies(state.doc, (ranges as SelectionRange[]), markType)) { return false }
        if (dispatch) {
            if ($cursor) {
                dispatch(state.tr.addStoredMark(markType.create(attrs)))
            } else {
                const tr = state.tr
                for (let i = 0; i < ranges.length; i++) {
                    const { $from, $to } = ranges[i]

                    let from = $from.pos, to = $to.pos, start = $from.nodeAfter, end = $to.nodeBefore
                    let spaceStart = start && start.isText && start.text !== null && start.text !== undefined ? /^\s*/.exec(start.text)?.[0].length ?? 0 : 0
                    let spaceEnd = end && end.isText && end.text !== null && end.text !== undefined ? /\s*$/.exec(end.text)?.[0].length ?? 0 : 0
                    if (from + spaceStart < to) {
                        from += spaceStart
                        to -= spaceEnd
                    }
                    tr.addMark(from, to, markType.create(attrs))
                }
                dispatch(tr.scrollIntoView())
            }
        }

        return true
    }
}

function wrapItemMy(nodeType: NodeType, options: Partial<MenuItemSpec> & { attrs?: Attrs | null }) {
    const passedOptions: MenuItemSpec = {
        run(state, dispatch) { return wrapIn(nodeType, options.attrs)(state, dispatch) },
        select(state) { return wrapIn(nodeType, options.attrs)(state) }
    }
    for (let prop in options) (passedOptions as any)[prop] = (options as any)[prop]
    return new MenuItem(passedOptions)
}

function blockTypeItem(nodeType: NodeType, options: Partial<MenuItemSpec> & { attrs?: Attrs | null }) {
    let command = setBlockType(nodeType, options.attrs)
    let passedOptions: MenuItemSpec = {
        run: command,
        enable(state) { return command(state) },
        active(state) {
            let { $from, to, node } = state.selection as NodeSelection
            if (node) {
                console.log($from.parent)
                return node.hasMarkup(nodeType, options.attrs)
            }


            return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs)
        }
    }

    for (let prop in options) { (passedOptions as any)[prop] = (options as any)[prop] }

    return new MenuItem(passedOptions)
}


export {
    setIconElement,
    canInsert, insertImageItem,
    markItem, linkItem, wrapListItem,
    markItemWithAttrsAndNoneActive,
    setMark,
    wrapItemMy
}