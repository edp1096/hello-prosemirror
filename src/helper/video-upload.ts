import { EditorState, Plugin } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema, NodeSpec } from "prosemirror-model"
import { MenuItem, MenuElement } from "../pkgs/menu"
import { setIconElement } from "./utils"

const videoTypes = ["video/mp4", "video/webm", "video/ogg"]

let editorView: EditorView

let UploadInputName = ""
let UploadURI = ""
let AccessURI = ""
let CallbackFunction: Function | null = null
let uploadErrorCallback: Function | null = null

export const videoNodeSpec: NodeSpec = {
    attrs: {
        src: {},
        title: { default: null },
        autoplay: { default: false },
        controls: { default: true },
        loop: { default: false },
        muted: { default: false }
    },
    inline: false,
    group: "block",
    draggable: true,
    parseDOM: [{
        tag: "video[src]", getAttrs(dom: HTMLElement) {
            return {
                src: dom.getAttribute("src"),
                title: dom.getAttribute("title"),
                autoplay: dom.hasAttribute("autoplay"),
                controls: dom.hasAttribute("controls"),
                loop: dom.hasAttribute("loop"),
                muted: dom.hasAttribute("muted")
            }
        }
    }],
    toDOM(node) {
        const { src, title, autoplay, controls, loop, muted } = node.attrs
        const attrs: any = { src, title }
        if (autoplay) attrs.autoplay = "autoplay"
        if (controls) attrs.controls = "controls"
        if (loop) attrs.loop = "loop"
        if (muted) attrs.muted = "muted"
        return ["video", attrs]
    }
}

const uploadFileForm = document.createElement("input")
uploadFileForm.setAttribute("type", "file")
uploadFileForm.setAttribute("multiple", "")
uploadFileForm.setAttribute("accept", ".mp4,.webm,.ogg")
uploadFileForm.onchange = uploadHandler

function setUploadURIs(
    uploadInputName: string,
    uploadURI: string,
    accessURI: string,
    callbackFunction: Function | null,
    errorCallback: Function | null,
): void {
    UploadInputName = uploadInputName
    UploadURI = uploadURI
    AccessURI = accessURI
    CallbackFunction = callbackFunction
    uploadErrorCallback = errorCallback
}

function dispatchVideo(view: EditorView, pos: number, schema: Schema, videoURI: string): void {
    const tr = view.state.tr
    const video = schema.nodes.video.create({
        src: videoURI,
        controls: true
    })

    view.dispatch(tr.replaceWith(pos, pos, video).scrollIntoView())
}

async function uploadVideo(view: EditorView, schema: Schema, event: Event, files: FileList, uploadInputName: string, uploadURI: string, accessURI: string): Promise<void> {
    for (const file of files) {
        if (!videoTypes.includes(file.type)) { continue }  // Pass if not a video

        const formData = new FormData()
        formData.append(uploadInputName, file)

        const r = await fetch(uploadURI, { method: 'POST', body: formData })
        if (r.ok) {
            const response = await r.json()
            const pos = view.posAtCoords({ left: (event as MouseEvent).clientX, top: (event as MouseEvent).clientY })

            if (CallbackFunction) { CallbackFunction(response) }
            for (const f of response.files) {
                const videoURL = `${accessURI}/${f.storagename}`;
                dispatchVideo(view, pos!.pos, schema, videoURL);
            }

            continue;
        }

        const error = await r.json()

        if (uploadErrorCallback) {
            uploadErrorCallback(error)
        } else {
            console.error("비디오 업로드 오류:", error)
            alert("비디오 업로드 오류: " + error)
        }
    }
}

function videoDropHandler(schema: Schema, uploadInputName: string, uploadURI: string, accessURI: string): Plugin<any> {
    const plugin = new Plugin({
        props: {
            handleDOMEvents: {
                drop: function (view: EditorView, event: Event): void {
                    const files = (event as DragEvent).dataTransfer?.files
                    if (files == undefined || files?.length == 0) { return }
                    if (event.preventDefault != undefined) { event.preventDefault() }
                    uploadVideo(view, schema, event, files, uploadInputName, uploadURI, accessURI)
                }
            }
        }
    })

    return plugin
}

function callBrowseFile(state: EditorState, dispatch: any, view: EditorView): boolean {
    uploadFileForm.type = "file"
    uploadFileForm.multiple = true
    uploadFileForm.click()

    editorView = view

    return true
}

function insertVideo(videoURI: string): void {
    const tr = editorView.state.tr
    const video = editorView.state.schema.nodes.video.create({
        src: videoURI,
        controls: true
    })
    const pos = tr.selection.anchor

    dispatchVideo(editorView, pos, editorView.state.schema, videoURI)
}

async function uploadHandler() {
    if (uploadFileForm.files == null || uploadFileForm.files.length === 0) { return }

    for (const file of uploadFileForm.files) {
        if (!file) { continue };
        if (!videoTypes.includes(file.type)) { continue }; // Pass if not a video

        const formData = new FormData()
        formData.append(UploadInputName, file)

        const r = await fetch(UploadURI, { method: 'POST', body: formData })
        if (r.ok) {
            const response = await r.json()

            if (CallbackFunction) { CallbackFunction(response) }
            for (const f of response.files) {
                const videoURL = `${AccessURI}/${f.storagename}`;
                insertVideo(videoURL);
            }

            continue;
        }

        const error = await r.json()

        if (uploadErrorCallback) {
            uploadErrorCallback(error)
        } else {
            console.error("비디오 업로드 오류:", error)
        }
    }
}

function getVideoUploadMenus(): MenuElement {
    const menuItemUploadVideo = {
        title: "비디오 업로드",
        icon: setIconElement("icon-file-video"),
        run: callBrowseFile
    }
    const uploadMenu = new MenuItem(menuItemUploadVideo)

    return uploadMenu
}

// export { dispatchVideo, videoDropHandler, getVideoUploadMenus, setUploadURIs }
export { dispatchVideo, getVideoUploadMenus, setUploadURIs }