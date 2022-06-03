import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema, DOMParser } from "prosemirror-model"
import { schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"
import { exampleSetup } from "prosemirror-example-setup"

const mySchema = new Schema({
    nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
    marks: schema.spec.marks
});

/* (window as any).view = new EditorView(document.querySelector("#editor") as HTMLElement, {
    state: EditorState.create({
        doc: DOMParser.fromSchema(mySchema).parse(document.querySelector("#content") as HTMLElement),
        plugins: exampleSetup({ schema: mySchema })
    })
}) */

let state = EditorState.create({
    doc: DOMParser.fromSchema(mySchema).parse(document.querySelector("#content")!),
    plugins: exampleSetup({ schema: mySchema })
});

(window as any).view = new EditorView(document.querySelector(".full"), { state })

class MyEditor { }

(globalThis as any).MyEditor = MyEditor

export default MyEditor
