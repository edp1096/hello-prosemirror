import { Schema, Attrs, Node, NodeType, ContentMatch } from "prosemirror-model"
import { Command, NodeSelection, TextSelection, AllSelection } from "prosemirror-state"
import {
    wrapIn, setBlockType, chainCommands, toggleMark, exitCode,
    joinUp, joinDown, lift, selectParentNode,
    // newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock, splitBlockAs, splitBlockKeepMarks
    newlineInCode, createParagraphNear, liftEmptyBlock, splitBlockKeepMarks
} from "prosemirror-commands"
import { wrapInList, splitListItem, liftListItem, sinkListItem } from "prosemirror-schema-list"
import { undo, redo } from "prosemirror-history"
import { undoInputRule } from "prosemirror-inputrules"
import { canSplit } from "prosemirror-transform"


function defaultBlockAt(match: ContentMatch) {
    // index 0 is alignment
    // for (let i = 0; i < match.edgeCount; i++) {
    for (let i = 1; i < match.edgeCount; i++) {
        let { type } = match.edge(i)
        if (type.isTextblock && !type.hasRequiredAttrs()) return type
    }

    return null
}

/// Create a variant of [`splitBlock`](#commands.splitBlock) that uses a custom function to determine the type of the newly split off block.
export function splitBlockAs(splitNode?: (node: Node, atEnd: boolean) => { type: NodeType, attrs?: Attrs } | null): Command {
    return (state, dispatch) => {
        let { $from, $to } = state.selection
        if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
            if (!$from.parentOffset || !canSplit(state.doc, $from.pos)) return false
            if (dispatch) dispatch(state.tr.split($from.pos).scrollIntoView())
            return true
        }

        if (!$from.parent.isBlock) return false

        if (dispatch) {
            let atEnd = $to.parentOffset == $to.parent.content.size
            let tr = state.tr

            if (state.selection instanceof TextSelection || state.selection instanceof AllSelection) tr.deleteSelection()
            let deflt = $from.depth == 0 ? null : defaultBlockAt($from.node(-1).contentMatchAt($from.indexAfter(-1)))
            let splitType = splitNode && splitNode($to.parent, atEnd)
            let types = splitType ? [splitType] : atEnd && deflt ? [{ type: deflt }] : undefined

            // console.log(deflt, types, splitType, $to.parent.type)

            let can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types)
            if (!types && !can && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt ? [{ type: deflt }] : undefined)) {
                if (deflt) types = [{ type: deflt }]
                can = true
            }

            if (can) {
                tr.split(tr.mapping.map($from.pos), 1, types)
                if (!atEnd && !$from.parentOffset && $from.parent.type != deflt) {
                    let first = tr.mapping.map($from.before()), $first = tr.doc.resolve(first)
                    if (deflt && $from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt))
                        tr.setNodeMarkup(tr.mapping.map($from.before()), deflt)
                }
            }

            dispatch(tr.scrollIntoView())
        }

        return true
    }
}

/// Split the parent block of the selection. If the selection is a text
/// selection, also delete its content.
export const splitBlock: Command = splitBlockAs()


const mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false

/// Inspect the given schema looking for marks and nodes from the basic schema, and if found, add key bindings related to them.
/// This will add:
///
/// * **Mod-b** for toggling [strong](#schema-basic.StrongMark)
/// * **Mod-i** for toggling [emphasis](#schema-basic.EmMark)
/// * **Mod-`** for toggling [code font](#schema-basic.CodeMark)
/// * **Ctrl-Shift-0** for making the current textblock a paragraph
/// * **Ctrl-Shift-1** to **Ctrl-Shift-Digit6** for making the current
///   textblock a heading of the corresponding level
/// * **Ctrl-Shift-Backslash** to make the current textblock a code block
/// * **Ctrl-Shift-8** to wrap the selection in an ordered list
/// * **Ctrl-Shift-9** to wrap the selection in a bullet list
/// * **Ctrl->** to wrap the selection in a block quote
/// * **Enter** to split a non-empty textblock in a list item while at the same time splitting the list item
/// * **Mod-Enter** to insert a hard break
/// * **Mod-_** to insert a horizontal rule
/// * **Backspace** to undo an input rule
/// * **Alt-ArrowUp** to `joinUp`
/// * **Alt-ArrowDown** to `joinDown`
/// * **Mod-BracketLeft** to `lift`
/// * **Escape** to `selectParentNode`
///
/// You can suppress or map these bindings by passing a `mapKeys` argument, which maps key names (say `"Mod-B"` to either `false`, to remove the binding, or a new key name string.
function buildKeymap(schema: Schema, mapKeys?: { [key: string]: false | string }) {
    let keys: { [key: string]: Command } = {}, type
    function bind(key: string, cmd: Command) {
        if (mapKeys) {
            let mapped = mapKeys[key]
            if (mapped === false) return
            if (mapped) key = mapped
        }
        keys[key] = cmd
    }

    bind("Mod-z", undo)
    bind("Shift-Mod-z", redo)
    bind("Backspace", undoInputRule)
    if (!mac) bind("Mod-y", redo)

    bind("Alt-ArrowUp", joinUp)
    bind("Alt-ArrowDown", joinDown)
    bind("Mod-BracketLeft", lift)
    bind("Escape", selectParentNode)

    if (type = schema.marks.strong) {
        bind("Mod-b", toggleMark(type))
        bind("Mod-B", toggleMark(type))
    }
    if (type = schema.marks.em) {
        bind("Mod-i", toggleMark(type))
        bind("Mod-I", toggleMark(type))
    }
    if (type = schema.marks.code) {
        bind("Mod-`", toggleMark(type))
    }

    if (type = schema.nodes.bullet_list) {
        bind("Shift-Ctrl-8", wrapInList(type))
    }
    if (type = schema.nodes.ordered_list) {
        bind("Shift-Ctrl-9", wrapInList(type))
    }
    if (type = schema.nodes.blockquote) {
        bind("Ctrl->", wrapIn(type))
    }
    if (type = schema.nodes.hard_break) {
        const br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
            if (dispatch) dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView())
            return true
        })
        bind("Mod-Enter", cmd)
        bind("Shift-Enter", cmd)
        if (mac) bind("Ctrl-Enter", cmd)
    }
    if (type = schema.nodes.list_item) {
        bind("Enter", splitListItem(type))
        bind("Mod-[", liftListItem(type))
        bind("Mod-]", sinkListItem(type))
    }
    if (type = schema.nodes.paragraph) {
        bind("Shift-Ctrl-0", setBlockType(type))
    }

    if (type = schema.nodes.code_block) {
        bind("Shift-Ctrl-\\", setBlockType(type))
    }
    if (type = schema.nodes.heading) {
        for (let i = 1; i <= 6; i++) {
            bind("Shift-Ctrl-" + i, setBlockType(type, { level: i }))
        }
    }
    if (type = schema.nodes.horizontal_rule) {
        const hr = type
        bind("Mod-_", (state, dispatch) => {
            if (dispatch) dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView())
            return true
        })
    }

    bind("Enter", chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock))

    return keys
}

export { buildKeymap }