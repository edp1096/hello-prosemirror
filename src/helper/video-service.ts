import { NodeSelection, EditorState } from "prosemirror-state"
import { NodeSpec, Node, Attrs } from "prosemirror-model"
// import { MenuItem, MenuElement } from "prosemirror-menu"
import { MenuItem, MenuElement } from "../pkgs/menu"
import { EditorView } from 'prosemirror-view'

import { TextField, openPrompt } from "./prompt"
import { setIconElement } from "./utils"


const videoServiceFormats = ["youtube", "dailymotion", "vimeo", "nicodong", "chzzk", "navertv"]

const videoServiceNodeSpec: NodeSpec = {
    attrs: {
        uri: { default: "" },
        title: { default: "Video streaming" }
    },
    inline: true,
    group: "inline",
    draggable: false,

    toDOM: (node: Node) => [
        "iframe",
        {
            "video-type": "video-stream-service",
            src: node.attrs.uri,
            // width: "720",
            // height: "405",
            title: node.attrs.title,
            class: "video"
        }
    ],
    parseDOM: [{
        tag: "iframe[video-type]",
        getAttrs: dom => {
            // const videoType = (dom as HTMLElement).getAttribute("video-type")
            const uri = (dom as HTMLElement).getAttribute("src")
            const title = (dom as HTMLElement).getAttribute("title")

            return { uri, title }
        }
    }]
}

function insertVideo() {
    let uri: string

    return function (state: EditorState, dispatch: any, view: EditorView) {
        let attrs = null
        const { $from } = state.selection, index = $from.index()
        const videoType = state.schema.nodes.video_service

        if (!$from.parent.canReplaceWith(index, index, videoType)) { return false }
        if (state.selection instanceof NodeSelection) { attrs = state.selection.node.attrs }

        const editorElement = view.dom.parentElement as HTMLElement

        openPrompt({
            title: "Paste link from Youtube, Vimeo, DailyMotion, Niconico douga, chzzk(clip), Naver TV",
            fields: { src: new TextField({ label: "URL", required: true, value: attrs && attrs.src }) },
            callback: (attrs: Attrs) => {
                if (!attrs.src) { return false }

                if (dispatch) {
                    uri = (attrs.src as string).replace("youtu.be", "youtube.com/embed")
                    uri = uri.replace("youtube.com/shorts/", "youtube.com/embed/")
                    uri = uri.replace("www.youtube.com/watch?v=", "youtube.com/embed/")
                    uri = uri.replace("dai.ly", "www.dailymotion.com/embed/video")
                    uri = uri.replace("www.dailymotion.com/video", "www.dailymotion.com/embed/video")
                    uri = uri.replace("vimeo.com/", "player.vimeo.com/video/")
                    uri = uri.replace("www.nicovideo.jp/watch/", "embed.nicovideo.jp/watch/")
                    uri = uri.replace("chzzk.naver.com/clips", "chzzk.naver.com/embed/clip")
                    uri = uri.replace("tv.naver.com/v/", "tv.naver.com/embed/")
                    uri = uri.replace("tv.naver.com/h/", "tv.naver.com/embed/")

                    let title = "Video streaming"
                    for (let i = 0; i < videoServiceFormats.length; i++) {
                        if (uri.includes(videoServiceFormats[i])) {
                            title = videoServiceFormats[i]
                            break
                        }
                    }

                    const vnode = videoType.create({ uri, title })
                    dispatch(state.tr.replaceSelectionWith(vnode))
                }
                view.focus()
            }
        }, editorElement)
    }
}

function getVideoServiceMenus(): MenuElement {
    const menuItem = {
        title: "Add video",
        icon: setIconElement("icon-youtube-play"),
        run: insertVideo()
    }

    return new MenuItem(menuItem)
}

export { videoServiceNodeSpec, getVideoServiceMenus }