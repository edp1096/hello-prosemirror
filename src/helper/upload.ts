import { EditorState, Plugin } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema } from "prosemirror-model"
import { MenuItem, MenuElement } from "prosemirror-menu"
import { setIconElement } from "./utils"


const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"]

let editorView: EditorView

let UploadURI = "" // let UploadURI = "http://localhost:8864/upload"
let AccessURI = "" // let AccessURI = "http://localhost:8864/files"

const uploadFileForm = document.createElement("input")
uploadFileForm.setAttribute("type", "file")
uploadFileForm.setAttribute("multiple", "")
uploadFileForm.setAttribute("accept", ".jpg,.png,.bmp")
uploadFileForm.onchange = uploadHandler

function setUploadURIs(uploadURI:string, accessURI:string) {
    UploadURI = uploadURI
    AccessURI = accessURI
}

function dispatchImage(view: EditorView, pos: number, schema: Schema, imageURI: string): void {
    const tr = view.state.tr
    const image = schema.nodes.image.create({ src: imageURI })

    view.dispatch(tr.replaceWith(pos, pos, image).scrollIntoView())
}

async function uploadImage(view: EditorView, schema: Schema, event: Event, files: FileList, uploadURI: string, accessURI: string): Promise<void> {
    for (const file of files) {
        if (!imageTypes.includes(file.type)) { return }  // Not an image

        const formData = new FormData()
        formData.append('file', file)

        const r = await fetch(uploadURI, { method: 'POST', body: formData })
        if (r.ok) {
            const response = await r.json()
            const pos = view.posAtCoords({ left: (event as MouseEvent).clientX, top: (event as MouseEvent).clientY })

            for (const f of response.files) {
                dispatchImage(view, pos!.pos, schema, `${accessURI}/${f.storagename}`)
            }
        }
    }
}

function imageDropHandler(schema: Schema, uploadURI: string, accessURI: string): Plugin<any> {
    const plugin = new Plugin({
        props: {
            handleDOMEvents: {
                drop: function (view: EditorView, event: Event): void {
                    const files = (event as DragEvent).dataTransfer?.files
                    if (files == undefined || files?.length == 0) { return }
                    if (event.preventDefault != undefined) { event.preventDefault() }
                    uploadImage(view, schema, event, files, uploadURI, accessURI)
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
    if (uploadFileForm.files == null) { return }

    for (const file of uploadFileForm.files!) {
        if (file == undefined) { return [] } // Selected nothing

        const formData = new FormData()
        formData.append('file', file)

        const r = await fetch(UploadURI, { method: 'POST', body: formData })
        if (r.ok) {
            const response = await r.json()

            for (const f of response.files) {
                insertImage(`${AccessURI}/${f.storagename}`)
            }
        }
    }
}

function getImageUploadMenus(): MenuElement {
    const menuItemUploadImage = { title: "Upload image", icon: setIconElement("bi-cloud-upload"), run: callBrowseFile }
    const uploadMenu = new MenuItem(menuItemUploadImage)

    return uploadMenu
}

export { dispatchImage, imageDropHandler, getImageUploadMenus, setUploadURIs }