import { NodeSelection, EditorState } from "prosemirror-state"
import { NodeSpec, Node, Attrs } from "prosemirror-model"
import { MenuItem, MenuElement } from "prosemirror-menu"
import { EditorView } from 'prosemirror-view'
import { TextField, openPrompt } from "./prompt"

export const youtubeNodeSpec: NodeSpec = {
    attrs: { uri: { default: "" } },
    inline: true,
    group: "inline",
    draggable: false,

    toDOM: (node: Node) => [
        "iframe",
        {
            src: node.attrs.uri,
            width: "420",
            height: "315",
            title: "Youtube video",
            class: "video"
        }
    ]
}

function insertYoutube() {
    let uri: string

    return function (state: EditorState, dispatch: any, view: EditorView) {
        let attrs = null
        const { $from } = state.selection, index = $from.index()
        const videoType = state.schema.nodes.youtube

        if (!$from.parent.canReplaceWith(index, index, videoType)) { return false }
        if (state.selection instanceof NodeSelection) { attrs = state.selection.node.attrs }

        openPrompt({
            title: "Insert youtube video",
            fields: { src: new TextField({ label: "URL", required: true, value: attrs && attrs.src }) },
            callback: (attrs: Attrs) => {
                if (!attrs.src) { return false }

                if (dispatch) {
                    uri = (attrs.src as string).replace("youtu.be", "youtube.com/embed")
                    dispatch(state.tr.replaceSelectionWith(videoType.create({ uri })))
                }
                view.focus()
            }
        })
    }
}

export function getYoutubeMenus(): MenuElement[] {
    const menuAddYoutube = new MenuItem({ label: "Add youtube", run: insertYoutube() })

    return [menuAddYoutube]
}