import { EditorState, Plugin } from "prosemirror-state"
import { EditorView, Decoration, DecorationSet } from "prosemirror-view"
import { Schema, DOMParser, DOMSerializer } from "prosemirror-model"
import { schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"

import { keymap } from "prosemirror-keymap"
import { history } from "prosemirror-history"
import { baseKeymap } from "prosemirror-commands"
import { dropCursor } from "prosemirror-dropcursor"
import { menuBar, MenuItem } from "prosemirror-menu"
import { gapCursor } from "prosemirror-gapcursor"
import { tableNodes } from "prosemirror-tables"

import { buildMenuItems } from "./helper/menu"
import { buildKeymap } from "./helper/keymap"
import { buildInputRules } from "./helper/inputrules"
import { imageDropHandler, dispatchImage } from "./helper/upload"

// import { exampleSetup } from "prosemirror-example-setup"

interface EditorOptionType {
    uploadActionURI: string
    uploadAccessURI: string
}

class MyEditor {
    schema: Schema
    state: EditorState
    content: HTMLElement
    view: EditorView
    uploadActionURI: string
    uploadAccessURI: string

    constructor(data: string, target: HTMLElement, options: EditorOptionType) {
        this.uploadActionURI = "http://localhost:8864/upload"
        this.uploadAccessURI = "http://localhost:8864/files"

        if (options != undefined) {
            if (options.uploadActionURI != undefined) { this.uploadActionURI = options.uploadActionURI }
            if (options.uploadAccessURI != undefined) { this.uploadAccessURI = options.uploadAccessURI }
        }

        this.content = document.implementation.createHTMLDocument().body
        this.content.innerHTML = data

        this.schema = new Schema({
            nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
            marks: schema.spec.marks
        })

        const basePlugin = this.setupBasePlugin({ schema: this.schema })
        const pluginImageDropHandler = imageDropHandler(this.schema, this.uploadActionURI, this.uploadAccessURI)
        const mergedPlugins = basePlugin.concat(pluginImageDropHandler)

        this.state = EditorState.create({
            doc: DOMParser.fromSchema(this.schema).parse(this.content),
            plugins: mergedPlugins
        })

        this.view = new EditorView(target, { state: this.state });
        (window as any).view = this.view
    }

    setupBasePlugin(options: {
        schema: Schema
        mapKeys?: {
            [key: string]: string | false
        }
        menuBar?: boolean
        history?: boolean
        floatingMenu?: boolean
        menuContent?: MenuItem[][]
    }) {
        const plugins = [
            buildInputRules(options.schema),
            keymap(buildKeymap(options.schema, options.mapKeys)),
            keymap(baseKeymap),
            dropCursor(),
            gapCursor(),
        ]

        if (options.menuBar !== false) {
            plugins.push(menuBar({
                floating: options.floatingMenu !== false,
                content: options.menuContent || buildMenuItems(options.schema).fullMenu
            }))
        }

        if (options.history !== false) { plugins.push(history()) }

        return plugins.concat(new Plugin({ props: { attributes: { class: "Editor-base-setup-style" } } }))
    }

    getHTML(): string {
        const domSerializer = DOMSerializer.fromSchema(this.schema)
        const fragment = domSerializer.serializeFragment(this.view.state.doc.content)
        const div = document.createElement("div")
        div.appendChild(fragment)

        return div.innerHTML
    }

    insertImage(imageURI: string): void {
        const tr = this.view.state.tr
        const image = this.schema.nodes.image.create({ src: imageURI })
        const pos = tr.selection.anchor

        dispatchImage(this.view, pos, this.schema, imageURI)
    }
}

(window as any).MyEditor = MyEditor
export default MyEditor
