import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { DOMParser as PDOMParser, Schema } from "prosemirror-model";
import { schema as baseSchema } from "prosemirror-schema-basic"
import { MenuItem, Dropdown } from "prosemirror-menu";

import {
    addColumnAfter,
    addColumnBefore,
    deleteColumn,
    addRowAfter,
    addRowBefore,
    deleteRow,
    mergeCells,
    splitCell,
    setCellAttr,
    toggleHeaderRow,
    toggleHeaderColumn,
    toggleHeaderCell,
    goToNextCell,
    deleteTable
} from "prosemirror-tables"
import {
    tableEditing,
    columnResizing,
    tableNodes,
    fixTables
} from "prosemirror-tables"

const schema = new Schema({
    nodes: baseSchema.spec.nodes.append(
        tableNodes({
            tableGroup: "block",
            cellContent: "block+",
            cellAttributes: {
                background: {
                    default: null,
                    getFromDOM(dom) { return (dom.style && dom.style.backgroundColor) || null; },
                    setDOMAttr(value, attrs) { if (value) { attrs.style = (attrs.style || "") + `background-color: ${value};` } }
                }
            }
        })
    ),
    marks: baseSchema.spec.marks
})

function item(label: string, cmd: any) { return new MenuItem({ label, select: cmd, run: cmd }) }
let tableMenu = [
    item("Insert column before", addColumnBefore),
    item("Insert column after", addColumnAfter),
    item("Delete column", deleteColumn),
    item("Insert row before", addRowBefore),
    item("Insert row after", addRowAfter),
    item("Delete row", deleteRow),
    item("Delete table", deleteTable),
    item("Merge cells", mergeCells),
    item("Split cell", splitCell),
    item("Toggle header column", toggleHeaderColumn),
    item("Toggle header row", toggleHeaderRow),
    item("Toggle header cells", toggleHeaderCell),
    item("Make cell green", setCellAttr("background", "#dfd")),
    item("Make cell not-green", setCellAttr("background", null))
];

const tableDropdown = new Dropdown(tableMenu, { label: "Table" })

const tableElementString = `
<table>
  <tr><th colspan="3" data-colwidth="100,0,0">Wide header</th></tr>
  <tr><td>One</td><td>Two</td><td>Three</td></tr>
  <tr><td>Four</td><td>Five</td><td>Six</td></tr>
</table>`;

const parser = new DOMParser();
const doc = PDOMParser.fromSchema(schema)
    .parse(parser.parseFromString(tableElementString, "text/xml").documentElement)
let state = EditorState.create({
    doc,
    plugins: [
        columnResizing(),
        tableEditing(),
        keymap({
            Tab: goToNextCell(1),
            "Shift-Tab": goToNextCell(-1)
        })
    ]
});
let fix = fixTables(state);
if (fix) state = state.apply(fix.setMeta("addToHistory", false));

document.execCommand("enableObjectResizing", false, false);
document.execCommand("enableInlineTableEditing", false, false);