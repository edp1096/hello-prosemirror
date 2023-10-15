import { EditorState, Plugin } from "prosemirror-state"
import { EditorView, Decoration, DecorationSet } from "prosemirror-view"
import { Schema, DOMParser, DOMSerializer, Fragment, MarkSpec } from "prosemirror-model"
// import { schema } from "prosemirror-schema-basic"
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

import { schema } from "./helper/schema"
import { buildMenuItems } from "./helper/menu"
import { buildKeymap } from "./helper/keymap"
import { buildInputRules } from "./helper/inputrules"
import { SetAlignSchemaNode } from "./helper/alignment"
import { FontSizeList, SetFontStyleSchemaMark } from "./helper/textstyle"
import { imageDropHandler, dispatchImage, getImageUploadMenus, setUploadURIs } from "./helper/upload"
import { setTableNodes, getTableMenus, tableContextMenuHandler } from "./helper/table"
import { youtubeNodeSpec, getYoutubeMenus } from "./helper/youtube"


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

    constructor(data: string, editorContainer: HTMLElement, options: EditorOptionType) {
        this.uploadActionURI = "http://localhost:8864/upload"
        this.uploadAccessURI = "http://localhost:8864/files"

        if (options != undefined) {
            if (options.uploadActionURI != undefined) { this.uploadActionURI = options.uploadActionURI }
            if (options.uploadAccessURI != undefined) { this.uploadAccessURI = options.uploadAccessURI }
        }

        setUploadURIs(this.uploadActionURI, this.uploadAccessURI)

        this.content = document.implementation.createHTMLDocument().body
        this.content.innerHTML = data

        schema.spec.nodes = SetAlignSchemaNode(schema.spec.nodes)
        schema.spec.nodes = setTableNodes(schema.spec.nodes)
        schema.spec.nodes = schema.spec.nodes.addBefore("iframe", "youtube", youtubeNodeSpec)
        schema.spec.nodes = addListNodes(schema.spec.nodes, "paragraph block*", "block")

        schema.spec.marks = SetFontStyleSchemaMark(schema.spec.marks)

        this.schema = new Schema({ nodes: schema.spec.nodes, marks: schema.spec.marks })

        const menus = buildMenuItems(this.schema)

        const basePlugin = this.setupBasePlugin({
            schema: this.schema,
            menuContent: (menus as MenuItem[][]),
            floatingMenu: false
        })
        const pluginImageDropHandler = imageDropHandler(this.schema, this.uploadActionURI, this.uploadAccessURI)
        const tablePlugins = [
            columnResizing({}), tableEditing(),
            keymap({ Tab: goToNextCell(1), "Shift-Tab": goToNextCell(-1) }),
            tableContextMenuHandler()
        ]

        const mergedPlugins = basePlugin.concat(pluginImageDropHandler, ...tablePlugins)

        this.state = EditorState.create({
            doc: DOMParser.fromSchema(this.schema).parse(this.content),
            plugins: mergedPlugins
        })

        const resizeObserver = new ResizeObserver((els) => {
            for (let el of els) {
                if (el.target == editorContainer) {
                    this.setupHeight(editorContainer)
                    break
                }
            }
        })
        resizeObserver.observe(editorContainer)

        this.view = new EditorView(editorContainer, { state: this.state })

        const w = globalThis as any
        w.view = this.view
    }

    setupHeight(editorContainer: HTMLElement) {
        const menubar = editorContainer.firstElementChild?.firstElementChild as HTMLElement

        const menubarPaddingTOP = parseInt((menubar.ownerDocument.defaultView?.getComputedStyle(menubar, null).getPropertyValue("padding-top"))?.replaceAll("px", "")!)
        const menubarPaddingBOT = parseInt((menubar.ownerDocument.defaultView?.getComputedStyle(menubar, null).getPropertyValue("padding-bottom"))?.replaceAll("px", "")!)
        const domPaddingTOP = parseInt(this.view.dom.ownerDocument.defaultView?.getComputedStyle(this.view.dom, null).getPropertyValue("padding-top")?.replaceAll("px", "")!)
        const domPaddingBOT = parseInt(this.view.dom.ownerDocument.defaultView?.getComputedStyle(this.view.dom, null).getPropertyValue("padding-bottom")?.replaceAll("px", "")!)
        const divScrollHeightCorrection = menubar.clientHeight + menubarPaddingTOP + menubarPaddingBOT + domPaddingTOP + domPaddingBOT

        this.view.dom.style.height = `${editorContainer.clientHeight - divScrollHeightCorrection}px`
        this.view.dom.style.overflowY = "auto"
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

        if (options.menuBar != false) {
            plugins.push(menuBar({
                floating: options.floatingMenu != false,
                content: options.menuContent || buildMenuItems(options.schema)
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
        const pos = tr.selection.anchor

        dispatchImage(this.view, pos, this.schema, imageURI)
    }
}

(globalThis as any).MyEditor = MyEditor
export default MyEditor
