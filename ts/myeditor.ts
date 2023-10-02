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
// import { getTableMenus, mergeTableMenu, setTableNodes } from "./helper/table"
import { getTableMenus, setTableNodes } from "./helper/table"
import { youtubeNodeSpec, getYoutubeMenus } from "./helper/youtube"

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

        schema.spec.nodes = setTableNodes(schema.spec.nodes)
        schema.spec.nodes = schema.spec.nodes.addBefore("iframe", "youtube", youtubeNodeSpec)
        schema.spec.nodes = addListNodes(schema.spec.nodes, "paragraph block*", "block")

        this.schema = new Schema({ nodes: schema.spec.nodes, marks: schema.spec.marks })

        // const baseMenus = buildMenuItems(this.schema).fullMenu
        // const tableMenus = [getTableMenus()]
        // const youtubeMenus = [getYoutubeMenus()]
        // const menus = baseMenus.concat(tableMenus, youtubeMenus)
        const menus = buildMenuItems(this.schema).fullMenu
        
        const basePlugin = this.setupBasePlugin({ schema: this.schema, menuContent: (menus as MenuItem[][]) })
        const pluginImageDropHandler = imageDropHandler(this.schema, this.uploadActionURI, this.uploadAccessURI)
        const tablePlugins = [
            columnResizing({}), tableEditing(),
            keymap({ Tab: goToNextCell(1), "Shift-Tab": goToNextCell(-1) })
        ]

        const mergedPlugins = basePlugin.concat(pluginImageDropHandler, ...tablePlugins)

        this.state = EditorState.create({
            doc: DOMParser.fromSchema(this.schema).parse(this.content),
            plugins: mergedPlugins
        })

        this.view = new EditorView(target, { state: this.state });
        (window as any).view = this.view
    }

    item(label: string, cmd: any) { return new MenuItem({ label, select: cmd, run: cmd }) }

    setupBasePlugin(options: {
        schema: Schema
        mapKeys?: { [key: string]: string | false }
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

    icon(text: string | null, name: string): Element {
        let span = document.createElement("span")
        span.className = "menuicon " + name
        span.title = name
        span.textContent = text

        return span
    }

    getHTML(): string {
        const view = this.view
        const schema = this.schema
        const docContent = view.state.doc.content
        const div = document.createElement("div")

        const fragment = DOMSerializer.fromSchema(schema).serializeFragment(docContent)
        div.appendChild(fragment)

        return div.innerHTML
    }

    setHTML(content: string | null | undefined): void {
        if (content == undefined || content == null) { content = "" }
        this.view.dom.innerHTML = content
    }

    insertImage(imageURI: string): void {
        const tr = this.view.state.tr
        const image = this.schema.nodes.image.create({ src: imageURI })
        const pos = tr.selection.anchor

        dispatchImage(this.view, pos, this.schema, imageURI)
    }
}

(globalThis as any).MyEditor = MyEditor
export default MyEditor
