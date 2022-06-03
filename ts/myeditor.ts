import { Schema, DOMParser } from "prosemirror-model"
import { schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"

// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.
const mySchema: Schema = new Schema({
    nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
    marks: schema.spec.marks
});

class MyEditor { }

(globalThis as any).MyEditor = MyEditor

export default MyEditor
