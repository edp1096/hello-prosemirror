// Source: https://github.com/shoobyban/prosemirror-dropimage
/* 
MIT License

Copyright (c) 2020 Sam Ban

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

import { Plugin } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema } from "prosemirror-model"

const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"]

export function dispatchImage(view: EditorView, pos: number, schema: Schema, imageURI: string): void {
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

export function imageDropHandler(schema: Schema, uploadURI: string, accessURI: string): Plugin<any> {
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
