import { EditorState, Plugin } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema } from "prosemirror-model"
import { menuBar, MenuItemSpec, MenuItem, MenuElement, Dropdown } from "prosemirror-menu"
import { setIconElement } from "./utils"

const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"]

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
            const result = await r.json()
            const pos = view.posAtCoords({ left: (event as MouseEvent).clientX, top: (event as MouseEvent).clientY })
            dispatchImage(view, pos!.pos, schema, `${accessURI}/${result.storename}`)
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
    alert("hello upload")


    return true
}

function getImageUploadMenus(): MenuElement[] {
    const menuItemUploadImage = { title: "Upload image", icon: setIconElement("bi-image"), run: callBrowseFile }
    // const menuItemUploadImage = { title: "Add table", icon: setIconElement("bi-image") }
    const uploadMenu = [new MenuItem(menuItemUploadImage)]

    return uploadMenu
}

export { dispatchImage, imageDropHandler, getImageUploadMenus }