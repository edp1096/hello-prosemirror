import { EditorState, Plugin } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema } from "prosemirror-model"
// import { MenuItem, MenuElement } from "prosemirror-menu"
import { MenuItem, MenuElement } from "../pkgs/menu"
import { setIconElement } from "./utils"


const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]

let editorView: EditorView

let UploadInputName = "" // let UploadInputName = "upload-files[]"
let UploadURI = "" // let UploadURI = "http://localhost:8864/upload"
let AccessURI = "" // let AccessURI = "http://localhost:8864/files"
let CallbackFunction: Function | null = null
let uploadErrorCallback: Function | null = null
const animatedImages = new Map<string, boolean>();

const uploadFileForm = document.createElement("input")
uploadFileForm.setAttribute("type", "file")
uploadFileForm.setAttribute("multiple", "")
uploadFileForm.setAttribute("accept", ".jpg,.jpeg,.png,.gif,.webp,.svg")
uploadFileForm.onchange = uploadHandler

function setImageUploadURIs(
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

async function isAnimatedImage(file: File): Promise<boolean> {
    if (file.name.toLowerCase().endsWith('.gif')) {
        return true;
    }

    if (file.name.toLowerCase().endsWith('.webp')) {
        try {
            const buffer = await file.arrayBuffer();
            const view = new Uint8Array(buffer);

            const searchPattern = (pattern: string) => {
                const patternBytes = new TextEncoder().encode(pattern);
                for (let i = 0; i < view.length - patternBytes.length; i++) {
                    let found = true;
                    for (let j = 0; j < patternBytes.length; j++) {
                        if (view[i + j] !== patternBytes[j]) {
                            found = false;
                            break;
                        }
                    }
                    if (found) return true;
                }
                return false;
            };

            return searchPattern('ANMF') || searchPattern('ANIM');
        } catch (error) {
            return true;
        }
    }

    return false;
}

function dispatchImage(view: EditorView, pos: number, schema: Schema, imageURI: string): void {
    const tr = view.state.tr
    const isAnimated = animatedImages.get(imageURI) || false;
    const image = schema.nodes.image.create({ src: imageURI, animate: isAnimated ? "true" : null })

    view.dispatch(tr.replaceWith(pos, pos, image).scrollIntoView())
}

async function uploadImage(view: EditorView, schema: Schema, event: Event, files: FileList, uploadInputName: string, uploadURI: string, accessURI: string): Promise<void> {
    for (const file of files) {
        if (!imageTypes.includes(file.type)) { continue }  // Not an image

        const formData = new FormData()
        formData.append(uploadInputName, file)

        const r = await fetch(uploadURI, { method: 'POST', body: formData })
        if (r.ok) {
            const response = await r.json()
            const pos = view.posAtCoords({ left: (event as MouseEvent).clientX, top: (event as MouseEvent).clientY })

            if (CallbackFunction) { CallbackFunction(response) }
            for (const f of response.files) {
                const isAnimated = await isAnimatedImage(file);
                const imageURL = `${accessURI}/${f.storagename}`;

                animatedImages.set(imageURL, isAnimated);

                dispatchImage(view, pos!.pos, schema, imageURL);
            }

            continue;
        }

        const error = await r.json()

        if (uploadErrorCallback) {
            uploadErrorCallback(error)
        } else {
            console.error("Upload error:", error)
            alert("Upload error: " + error)
        }
    }
}

function imageDropHandler(schema: Schema, uploadInputName: string, uploadURI: string, accessURI: string): Plugin<any> {
    const plugin = new Plugin({
        props: {
            handleDOMEvents: {
                drop: function (view: EditorView, event: Event): void {
                    const files = (event as DragEvent).dataTransfer?.files
                    if (files == undefined || files?.length == 0) { return }
                    if (event.preventDefault != undefined) { event.preventDefault() }
                    uploadImage(view, schema, event, files, uploadInputName, uploadURI, accessURI)
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

function insertImage(imageURI: string): void {
    const tr = editorView.state.tr
    const image = editorView.state.schema.nodes.image.create({ src: imageURI })
    const pos = tr.selection.anchor

    dispatchImage(editorView, pos, editorView.state.schema, imageURI)
}

async function uploadHandler() {
    if (uploadFileForm.files == null || uploadFileForm.files.length === 0) { return }

    for (const file of uploadFileForm.files) {
        if (!file) continue;

        const formData = new FormData()
        formData.append(UploadInputName, file)

        const r = await fetch(UploadURI, { method: 'POST', body: formData })
        if (r.ok) {
            const response = await r.json()

            if (CallbackFunction) { CallbackFunction(response) }
            for (const f of response.files) {
                const isAnimated = await isAnimatedImage(file);
                const imageURL = `${AccessURI}/${f.storagename}`;

                animatedImages.set(imageURL, isAnimated);

                insertImage(imageURL);
            }

            continue;
        }

        const error = await r.json()

        if (uploadErrorCallback) {
            uploadErrorCallback(error)
        } else {
            console.error("Upload error:", error)
            // alert("Upload error: " + error.message)
        }
    }
}

function getImageUploadMenus(): MenuElement {
    const menuItemUploadImage = {
        title: "Upload image",
        // icon: setIconElement("icon-picture-1"),
        icon: setIconElement("icon-file-image"),
        run: callBrowseFile
    }
    const uploadMenu = new MenuItem(menuItemUploadImage)

    return uploadMenu
}

// export { dispatchImage, imageDropHandler, getImageUploadMenus, setImageUploadURIs }
export { dispatchImage, getImageUploadMenus, setImageUploadURIs }