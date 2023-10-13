import { IconSpec, MenuItem, MenuItemSpec } from "prosemirror-menu"
import { Node, NodeType, MarkType, Attrs, Fragment, Slice, ResolvedPos, Mark } from "prosemirror-model"
import { NodeSelection, EditorState, TextSelection, SelectionRange, Command, Transaction } from "prosemirror-state"
// import { toggleMark, lift, joinUp, wrapIn, setBlockType } from "prosemirror-commands"
import { toggleMark, lift, joinUp } from "prosemirror-commands"
import { wrapInList } from "prosemirror-schema-list"
import { Transform, findWrapping, AddNodeMarkStep, ReplaceStep, ReplaceAroundStep } from "prosemirror-transform"

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

/// Wrap the selection in a node of the given type with the given attributes.
function wrapIn(nodeType: NodeType, attrs: Attrs | null = null): Command {
    return function (state, dispatch) {
        const { $from, $to } = state.selection
        const range = $from.blockRange($to)
        const wrapping = range && findWrapping(range, nodeType, attrs)
        if (!wrapping) { return false }

        if (dispatch) {
            dispatch(state.tr.wrap(range!, wrapping).scrollIntoView())
        }

        return true
    }
}

function wrapItemMy(nodeType: NodeType, options: Partial<MenuItemSpec> & { attrs?: Attrs | null }) {
    const passedOptions: MenuItemSpec = {
        run(state, dispatch) { return wrapIn(nodeType, options.attrs)(state, dispatch) },
        select(state) { return wrapIn(nodeType, options.attrs)(state) }
    }

    for (const prop in options) {
        (passedOptions as any)[prop] = (options as any)[prop]
    }

    return new MenuItem(passedOptions)
}

function canChangeType(doc: Node, pos: number, type: NodeType) {
    const $pos = doc.resolve(pos), index = $pos.index()
    return $pos.parent.canReplaceWith(index, index + 1, type)
}

function trSetBlockType(tr: Transform, from: number, to: number, type: NodeType, attrs: Attrs | null) {
    if (!type.isTextblock) throw new RangeError("Type given to setBlockType should be a textblock")
    const mapFrom = tr.steps.length
    tr.doc.nodesBetween(from, to, (node, pos) => {
        if (node.isTextblock && !node.hasMarkup(type, attrs) && canChangeType(tr.doc, tr.mapping.slice(mapFrom).map(pos), type)) {
            // Ensure all markup that isn't allowed in the new node type is cleared
            tr.clearIncompatible(tr.mapping.slice(mapFrom).map(pos, 1), type)

            const mapping = tr.mapping.slice(mapFrom)
            const startM = mapping.map(pos, 1), endM = mapping.map(pos + node.nodeSize, 1)
            const fragmentSlice = new Slice(Fragment.from(type.create(attrs, null, node.marks)), 0, 0)

            tr.step(new ReplaceAroundStep(startM, endM, startM + 1, endM - 1, fragmentSlice, 1, true))

            return false
        }
    })
}

/// Returns a command that tries to set the selected textblocks to the given node type with the given attributes.
function setBlockType(nodeType: NodeType, attrs: Attrs | null = null): Command {
    return function (state, dispatch) {
        let applicable = false

        for (let i = 0; i < state.selection.ranges.length && !applicable; i++) {
            const { $from: { pos: from }, $to: { pos: to } } = state.selection.ranges[i]
            state.doc.nodesBetween(from, to, (node, pos) => {
                if (applicable) { return false }
                if (!node.isTextblock || node.hasMarkup(nodeType, attrs)) { return }
                if (node.type == nodeType) {
                    applicable = true
                } else {
                    const $pos = state.doc.resolve(pos), index = $pos.index()
                    applicable = $pos.parent.canReplaceWith(index, index + 1, nodeType)
                }
            })
        }

        if (!applicable) { return false }

        if (dispatch) {
            const tr = state.tr

            for (let i = 0; i < state.selection.ranges.length; i++) {
                const { $from: { pos: from }, $to: { pos: to } } = state.selection.ranges[i]
                tr.setBlockType(from, to, nodeType, attrs)
            }

            dispatch(tr.scrollIntoView())
        }

        return true
    }
}

function blockTypeItemMy(nodeType: NodeType, options: Partial<MenuItemSpec> & { attrs?: Attrs | null }) {
    const command = setBlockType(nodeType, options.attrs)
    const passedOptions: MenuItemSpec = {
        run(state, dispatch) { command(state, dispatch) },
        enable(state) { return command(state) },
        active(state) {
            const { $from, to, node } = state.selection as NodeSelection
            if (node) { return node.hasMarkup(nodeType, options.attrs) }

            return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs)
        }
    }

    for (const prop in options) {
        (passedOptions as any)[prop] = (options as any)[prop]
    }

    return new MenuItem(passedOptions)
}


function aligner(nodeType: NodeType, attrs: Attrs | null = null): Command {
    return function (state, dispatch) {
        if (dispatch) {
            let tr = state.tr
            for (let i = 0; i < state.selection.ranges.length; i++) {
                const { $from: { pos: from }, $to: { pos: to } } = state.selection.ranges[i]

                tr.doc.nodesBetween(from, to, (node, pos) => {
                    if (!node.isTextblock) { return }
                    // if (!node.isBlock) { return }
                    // const blockFrom = pos
                    // const blockTo = pos + node.nodeSize

                    // console.log("node name, type:", node.type.name, node.type, nodeType)
                    // console.log("from, to, blockFrom, blockTo:", from, to, blockFrom, blockTo)
                    console.log("tag, attrs:", node.attrs, attrs)

                    const myAttrs: Attrs = { tagName: node.attrs.tagName, alignment: attrs?.alignment }

                    tr.setNodeMarkup(pos, node.type, myAttrs, node.marks)
                    // tr.setBlockType(from, to, node.type, myAttrs)
                    // tr.setBlockType(from, to, nodeType, attrs)
                    dispatch(tr.scrollIntoView())
                })
            }
        }

        return true
    }
}

function AlignItemMy(nodeType: NodeType, options: Partial<MenuItemSpec> & { attrs?: Attrs | null }) {
    // const passedOptions: MenuItemSpec = {
    //     run(state, dispatch) { return aligner(nodeType, options.attrs)(state, dispatch) },
    //     select(state) { return wrapIn(nodeType, options.attrs)(state) }
    // }

    const passedOptions: MenuItemSpec = {
        run(state, dispatch) { aligner(nodeType, options.attrs)(state, dispatch) },
        // run(state, dispatch) { setBlockType(nodeType, options.attrs)(state, dispatch) },
        enable(state) {
            // return true
            return aligner(nodeType, options.attrs)(state)
            // return setBlockType(nodeType, options.attrs)(state)
        },
        active(state) {
            const { $from, to, node } = state.selection as NodeSelection
            if (node) { return node.hasMarkup(nodeType, options.attrs) }

            return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs)
        }
    }
    for (const prop in options) {
        (passedOptions as any)[prop] = (options as any)[prop]
    }

    return new MenuItem(passedOptions)
}

export {
    setIconElement,
    canInsert, insertImageItem,
    markItem, linkItem, wrapListItem,
    markItemWithAttrsAndNoneActive,
    setMark,
    wrapItemMy, blockTypeItemMy,
    AlignItemMy
}