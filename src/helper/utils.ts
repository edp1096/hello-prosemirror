import { IconSpec } from "prosemirror-menu"
import { Schema, Node, NodeSpec, NodeType, Mark, MarkSpec, MarkType, DOMOutputSpec, Fragment, ParseRule } from "prosemirror-model"
import { NodeSelection, EditorState, TextSelection, SelectionRange, Command, Transaction } from "prosemirror-state"


function setIconElement(iconName: string): IconSpec {
    const iconEL = document.createElement("i")
    iconEL.setAttribute("class", iconName)
    iconEL.setAttribute("style", "font-size: 1.3em; margin: -0.3em;")

    const result = { dom: iconEL }

    return result
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


export { setIconElement, setMark }