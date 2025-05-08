import { Plugin } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema } from "prosemirror-model"
import { dispatchImage } from "./image-upload"
import { dispatchVideo } from "./video-upload"

const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
const videoTypes = ["video/mp4", "video/webm", "video/ogg"]

async function handleFileDrop(view: EditorView, schema: Schema, event: Event, files: FileList, uploadInputName: string, uploadURI: string, accessURI: string): Promise<void> {
    for (const file of files) {
        if (!file) continue;

        const formData = new FormData()
        formData.append(uploadInputName, file)

        const r = await fetch(uploadURI, { method: 'POST', body: formData })
        if (r.ok) {
            const response = await r.json()
            const pos = view.posAtCoords({ left: (event as MouseEvent).clientX, top: (event as MouseEvent).clientY })?.pos || view.state.selection.anchor

            for (const f of response.files) {
                const fileURL = `${accessURI}/${f.storagename}`;

                if (imageTypes.includes(file.type)) {
                    dispatchImage(view, pos, schema, fileURL); // Do image
                } else if (videoTypes.includes(file.type)) {
                    dispatchVideo(view, pos, schema, fileURL); // Do video
                }
            }
        }
    }
}

function fileDropHandler(schema: Schema, uploadInputName: string, uploadURI: string, accessURI: string): Plugin<any> {
    const plugin = new Plugin({
        props: {
            handleDOMEvents: {
                drop: function (view: EditorView, event: Event): void {
                    const files = (event as DragEvent).dataTransfer?.files
                    if (files == undefined || files?.length == 0) { return }
                    if (event.preventDefault != undefined) { event.preventDefault() }
                    handleFileDrop(view, schema, event, files, uploadInputName, uploadURI, accessURI)
                }
            }
        }
    })

    return plugin
}

export { fileDropHandler }