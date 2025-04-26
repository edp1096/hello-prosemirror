import { NodeSelection, EditorState, Transaction } from "prosemirror-state"
import { NodeSpec, Node, Attrs } from "prosemirror-model"
// import { MenuItem, MenuElement } from "prosemirror-menu"
import { MenuItem, MenuElement } from "../pkgs/menu"
import { EditorView } from 'prosemirror-view'

import { TextField, openPrompt } from "./prompt"
import { setIconElement } from "./utils"


const videoServiceFormats = [
    "youtube.com",
    "dailymotion.com",
    "vimeo.com",
    "nicovideo",
    "chzzk.naver.com",
    "tv.naver.com",
    "tiktok.com",
    "bilibili.com",
    "soundcloud.com",
    "nonoki.com",
    "mixcloud.com",
]

const videoServiceNodeSpec: NodeSpec = {
    attrs: {
        uri: { default: "" },
        title: { default: "Video streaming" },
        vertical: { default: false },
        className: { default: "video" }
    },
    inline: true,
    group: "inline",
    draggable: false,

    toDOM: (node: Node) => {
        const attrs = {
            "video-type": "video-stream-service",
            src: node.attrs.uri,
            // width: "720",
            // height: "405",
            title: node.attrs.title,
            class: node.attrs.className,
            scrolling: "no",
        }

        if (node.attrs.vertical) {
            attrs.class = "video vertical";
        }

        return ["iframe", attrs];
    },
    parseDOM: [{
        tag: "iframe[video-type]",
        getAttrs: dom => {
            // const videoType = (dom as HTMLElement).getAttribute("video-type")
            const uri = (dom as HTMLElement).getAttribute("src");
            const title = (dom as HTMLElement).getAttribute("title");
            const vertical = (dom as HTMLElement).getAttribute("class") == "video vertical" ? true : false;
            const className = (dom as HTMLElement).getAttribute("class") ? (dom as HTMLElement).getAttribute("class") : "video";
            if (!uri) { return false; }

            return { uri, title, vertical, className };
        }
    }]
}

const videoLinkUriModalDescription = `
Paste link from
Youtube, Vimeo, DailyMotion, Niconico douga, chzzk(clip), Naver TV, TikTok, Bilibili.com,
SoundCloud, Nonoki, MixCloud`;

function insertVideo() {
    let uri: string

    const cmd = function (state: EditorState, dispatch: ((tr: Transaction) => void), view: EditorView) {
        let attrs = null
        const { $from } = state.selection, index = $from.index()
        const videoType = state.schema.nodes.video_service

        if (!$from.parent.canReplaceWith(index, index, videoType)) { return false }
        if (state.selection instanceof NodeSelection) { attrs = state.selection.node.attrs }

        const editorElement = view.dom.parentElement as HTMLElement

        openPrompt({
            title: "Insert media",
            description: videoLinkUriModalDescription,
            fields: { src: new TextField({ label: "URL", required: true, value: attrs && attrs.src }) },
            callback: async (attrs: Attrs) => {
                if (!attrs.src) { return false }

                if (dispatch) {
                    let vertical = false;
                    let className = "video"

                    uri = attrs.src as string

                    const portraitURLs = [
                        "tv.naver.com/h/",
                        "youtube.com/shorts/",
                        "tiktok.com"
                    ];

                    if (portraitURLs.some(p => uri.includes(p))) {
                        vertical = true;
                    }

                    const soundURLs = [
                        "soundcloud.com",
                        "nonoki.com",
                        "mixcloud.com"
                    ];
                    if (soundURLs.some(p => uri.includes(p))) {
                        className = "sound";
                    }

                    uri = uri.replace("youtu.be", "youtube.com/embed")
                    uri = uri.replace("youtube.com/shorts/", "youtube.com/embed/")
                    uri = uri.replace("www.youtube.com/watch?v=", "youtube.com/embed/")

                    uri = uri.replace("dai.ly", "www.dailymotion.com/embed/video")
                    uri = uri.replace("www.dailymotion.com/video", "www.dailymotion.com/embed/video")

                    uri = uri.replace("vimeo.com/", "player.vimeo.com/video/")

                    uri = uri.replace("www.nicovideo.jp/watch/", "embed.nicovideo.jp/watch/")

                    uri = uri.replace("chzzk.naver.com/clips", "chzzk.naver.com/embed/clip")
                    uri = uri.replace("tv.naver.com/v/", "tv.naver.com/embed/")
                    uri = uri.replace("tv.naver.com/h/", "tv.naver.com/embed/")

                    if (uri.includes("soundcloud.com")) {
                        if (!uri.includes("w.soundcloud.com/player")) {
                            uri = "https://w.soundcloud.com/player/?url=" + encodeURIComponent(uri) + "&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false&visual=false";
                        }
                    }
                    if (uri.includes("nonoki.com")) {
                        const feedMatch = uri.match(/nonoki.com\/music\/track\/([^/]+)\/([^/]+)/);
                        if (feedMatch && feedMatch[1] && feedMatch[2]) {
                            uri = "https://nonoki.com/music/track/" + feedMatch[1] + "/" + feedMatch[2] + "/embed";
                        }
                    }
                    if (uri.includes("mixcloud.com")) {
                        const feedMatch = uri.match(/www.mixcloud.com\/([^/]+)\/([^/]+)/);
                        if (feedMatch && feedMatch[1] && feedMatch[2]) {
                            uri = "https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=/" + feedMatch[1] + "/" + feedMatch[2] + "/";
                        }
                    }


                    if (uri.includes("tiktok.com")) {
                        const videoIdMatch = uri.match(/\/video\/(\d+)/);
                        if (videoIdMatch && videoIdMatch[1]) {
                            uri = "https://www.tiktok.com/embed/v2/" + videoIdMatch[1];
                        }
                    }

                    if (uri.includes("bilibili.com/video")) {
                        const bvidMatch = uri.match(/\/video\/(BV[a-zA-Z0-9]+)/);
                        if (bvidMatch && bvidMatch[1]) {
                            uri = "https://player.bilibili.com/player.html?bvid=" + bvidMatch[1] + "&high_quality=1&danmaku=0&autoplay=false";
                        }
                        const avidMatch = uri.match(/\/video\/av(\d+)/);
                        if (avidMatch && avidMatch[1]) {
                            uri = "https://player.bilibili.com/player.html?aid=" + avidMatch[1] + "&high_quality=1&danmaku=0&autoplay=false";
                        }
                    }

                    // let title = "Video streaming"
                    let title = ""
                    for (let i = 0; i < videoServiceFormats.length; i++) {
                        if (uri.includes(videoServiceFormats[i])) {
                            title = videoServiceFormats[i]
                            break
                        }
                    }

                    if (title == "") {
                        return false;
                    }

                    const vnode = videoType.create({ uri, title, vertical, className })
                    dispatch(state.tr.replaceSelectionWith(vnode))
                }
                view.focus()
            }
        }, editorElement)
    }

    return cmd
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