import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema, DOMParser, DOMSerializer } from "prosemirror-model"
import { schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"
import { exampleSetup } from "prosemirror-example-setup"

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
            plugins: exampleSetup({ schema: this.schema })
        });

        this.view = new EditorView(target, { state: this.state });
        (window as any).view = this.view
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
