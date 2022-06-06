import { EditorState, Plugin } from "prosemirror-state"
import { EditorView, Decoration, DecorationSet } from "prosemirror-view"
import { Schema, DOMParser, DOMSerializer, Fragment } from "prosemirror-model"
import { schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"

import { keymap } from "prosemirror-keymap"
import { history } from "prosemirror-history"
import { baseKeymap, setBlockType } from "prosemirror-commands"
import { dropCursor } from "prosemirror-dropcursor"
import { menuBar, MenuItemSpec, MenuItem, Dropdown } from "prosemirror-menu"
import { gapCursor } from "prosemirror-gapcursor"

import {
    addColumnAfter, addColumnBefore, deleteColumn,
    addRowBefore, addRowAfter, deleteRow,
    splitCell, mergeCells,
    setCellAttr,
    toggleHeaderColumn, toggleHeaderRow, toggleHeaderCell,
    goToNextCell,
    deleteTable,
    tableEditing, columnResizing, tableNodes, fixTables
} from "prosemirror-tables"

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

        const tableNodeSpecs = tableNodes({
            tableGroup: "block",
            cellContent: "block+",
            cellAttributes: {
                background: {
                    default: null,
                    getFromDOM(dom: Element): string | null {
                        return ((dom as HTMLElement).style && (dom as HTMLElement).style.backgroundColor) || null
                    },
                    setDOMAttr(value: string, attrs: any): void {
                        if (value) { attrs.style = (attrs.style || "") + `background-color: ${value};` }
                    }
                }
            }
        })

        schema.spec.nodes = schema.spec.nodes.append(tableNodeSpecs)

        this.schema = new Schema({
            // nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
            nodes: schema.spec.nodes,
            marks: schema.spec.marks
        })

        const tableMenu = [
            this.item("Insert column before", addColumnBefore),
            this.item("Insert column after", addColumnAfter),
            this.item("Delete column", deleteColumn),
            this.item("Insert row before", addRowBefore),
            this.item("Insert row after", addRowAfter),
            this.item("Delete row", deleteRow),
            this.item("Delete table", deleteTable),
            this.item("Merge cells", mergeCells),
            this.item("Split cell", splitCell),
            this.item("Toggle header column", toggleHeaderColumn),
            this.item("Toggle header row", toggleHeaderRow),
            this.item("Toggle header cells", toggleHeaderCell),
            this.item("Make cell green", setCellAttr("background", "#dfd")),
            this.item("Make cell red", setCellAttr("background", "#faa")),
            this.item("Make cell non-green", setCellAttr("background", null))
        ]
        const tableDropdown = new Dropdown(tableMenu, { label: "Edit table" })

        const menu = buildMenuItems(this.schema).fullMenu
        menu.push([tableDropdown])

        const menuAddTable = new MenuItem({ label: "Add table", run: this.addTable })
        menu.push([menuAddTable])

        const basePlugin = this.setupBasePlugin({ schema: this.schema, menuContent: (menu as MenuItem[][]) })
        const pluginImageDropHandler = imageDropHandler(this.schema, this.uploadActionURI, this.uploadAccessURI)
        const mergedPlugins = basePlugin.concat(pluginImageDropHandler)

        const tablePlugins = [
            columnResizing({}),
            tableEditing(),
            keymap({
                Tab: goToNextCell(1),
                "Shift-Tab": goToNextCell(-1)
            })
        ]
        // mergedPlugins.push(...tablePlugins)
        mergedPlugins.unshift(...tablePlugins)

        this.state = EditorState.create({
            doc: DOMParser.fromSchema(this.schema).parse(this.content),
            plugins: mergedPlugins
        })

        // let fix = fixTables(this.state)
        // if (fix) this.state = this.state.apply(fix.setMeta('addToHistory', false));

        this.view = new EditorView(target, { state: this.state });
        (window as any).view = this.view
    }

    item(label: string, cmd: any) { return new MenuItem({ label, select: cmd, run: cmd }) }

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

    setupTablePlugin() {

    }

    icon(text: string | null, name: string): Element {
        let span = document.createElement("span")
        span.className = "menuicon " + name
        span.title = name
        span.textContent = text

        return span
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

    addTable(state: EditorState, dispatch: any, view: EditorView): boolean {
        const tr = view.state.tr

        const tableRowNode = state.schema.nodes.table_row.create(undefined, Fragment.fromArray([
            state.schema.nodes.table_cell.createAndFill()!,
            state.schema.nodes.table_cell.createAndFill()!
        ]))
        const tableNode = state.schema.nodes.table.create(undefined, Fragment.fromArray([tableRowNode]))

        dispatch(tr.replaceSelectionWith(tableNode).scrollIntoView())

        return true
    }
}

(window as any).MyEditor = MyEditor
export default MyEditor
