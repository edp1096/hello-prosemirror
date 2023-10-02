import { NodeSelection, EditorState } from "prosemirror-state"
import { NodeSpec, Node, Attrs } from "prosemirror-model"
import { MenuItem, MenuElement, MenuItemSpec } from "prosemirror-menu"
import { EditorView } from 'prosemirror-view'

import { TextField, openPrompt } from "./prompt"
import { setIconElement } from "./utils"

const videoFormat = ["youtube", "dailymotion", "vimeo"]

const youtubeNodeSpec: NodeSpec = {
    attrs: { uri: { default: "" } },
    inline: true,
    group: "inline",
    draggable: false,

    toDOM: (node: Node) => [
        "iframe",
        {
            "video-type": "youtube",
            src: node.attrs.uri,
            width: "720",
            height: "405",
            title: "Youtube video",
            class: "video"
        }
    ],
    parseDOM: [{
        tag: "iframe[video-type]",
        getAttrs: dom => {
            console.log(dom)
            const videoType = (dom as HTMLElement).getAttribute("video-type")
            const uri = (dom as HTMLElement).getAttribute("src")

            return { uri }
        }
    }]
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
                    uri = uri.replace("www.youtube.com/watch?v=", "youtube.com/embed/")
                    uri = uri.replace("dai.ly", "www.dailymotion.com/embed/video")
                    uri = uri.replace("www.dailymotion.com/video", "www.dailymotion.com/embed/video")
                    uri = uri.replace("vimeo.com/", "player.vimeo.com/video/")

                    dispatch(state.tr.replaceSelectionWith(videoType.create({ uri })))
                }
                view.focus()
            }
        })
    }
}

function getYoutubeMenus(): MenuElement[] {
    const menuItem = {
        title: "Add youtube",
        icon: setIconElement("bi-youtube"),
        run: insertYoutube()
    }

    return [new MenuItem(menuItem)]
}

export { youtubeNodeSpec, getYoutubeMenus }