import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema, DOMParser, DOMSerializer } from "prosemirror-model"
import { schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"

import { keymap } from "prosemirror-keymap"
import { history } from "prosemirror-history"
import { baseKeymap } from "prosemirror-commands"
import { Plugin } from "prosemirror-state"
import { dropCursor } from "prosemirror-dropcursor"
import { menuBar, MenuItem } from "prosemirror-menu"
import { gapCursor } from "prosemirror-gapcursor"

import { buildMenuItems } from "./helper/menu"
import { buildKeymap } from "./helper/keymap"
import { buildInputRules } from "./helper/inputrules"

// import { exampleSetup } from "prosemirror-example-setup"

class MyEditor {
    schema: Schema
    state: EditorState
    content: HTMLElement
    view: EditorView

    constructor(data: string, target: HTMLElement) {
        this.content = document.implementation.createHTMLDocument().body
        this.content.innerHTML = data

        this.schema = new Schema({
            nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
            marks: schema.spec.marks
        })

        this.state = EditorState.create({
            doc: DOMParser.fromSchema(this.schema).parse(this.content),
            plugins: this.setupPlugin({ schema: this.schema })
        });

        this.view = new EditorView(target, { state: this.state });
        (window as any).view = this.view
    }

    setupPlugin(options: {
        schema: Schema
        mapKeys?: { [key: string]: string | false }
        menuBar?: boolean
        history?: boolean
        floatingMenu?: boolean
        menuContent?: MenuItem[][]
    }) {
        let plugins = [
            buildInputRules(options.schema),
            keymap(buildKeymap(options.schema, options.mapKeys)),
            keymap(baseKeymap),
            dropCursor(),
            gapCursor()
        ]
        if (options.menuBar !== false)
            plugins.push(menuBar({
                floating: options.floatingMenu !== false,
                content: options.menuContent || buildMenuItems(options.schema).fullMenu
            }))
        if (options.history !== false)
            plugins.push(history())

        return plugins.concat(new Plugin({
            props: {
                attributes: { class: "ProseMirror-example-setup-style" }
            }
        }))
    }

    getHTML() {
        const domSerializer = DOMSerializer.fromSchema(this.schema)
        const fragment = domSerializer.serializeFragment(this.view.state.doc.content)
        const div = document.createElement("div")
        div.appendChild(fragment)

        return div.innerHTML
    }
}

(window as any).MyEditor = MyEditor
export default MyEditor
