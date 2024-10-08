import OrderedMap from 'orderedmap'

import { EditorState, Plugin } from "prosemirror-state"
import { Fragment, NodeSpec } from "prosemirror-model"
// import { MenuItem, MenuElement } from "prosemirror-menu"
import { MenuItem, MenuElement } from "../pkgs/menu"
import { EditorView } from "prosemirror-view"

import { setIconElement } from "./utils"

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


function setTableNodes(nodes: OrderedMap<NodeSpec>): OrderedMap<NodeSpec> {
    const tableNodeSpecs = tableNodes({
        tableGroup: "block",
        cellContent: "block+",
        cellAttributes: {
            background: {
                default: null,
                getFromDOM(dom: Element): string | null {
                    return ((dom as HTMLElement).style && (dom as HTMLElement).style.backgroundColor) || null
                },
                setDOMAttr(value: unknown, attrs: any): void {
                    if (value) { attrs.style = (attrs.style || "") + `background-color: ${value};` }
                }
            }
        }
    })

    return nodes.append((tableNodeSpecs as NodeSpec))
}

function dispatchTable(state: EditorState, dispatch: any, view: EditorView): boolean {
    const tr = view.state.tr
    const tableRowNode = state.schema.nodes.table_row.create(undefined, Fragment.fromArray([
        state.schema.nodes.table_cell.createAndFill()!,
        state.schema.nodes.table_cell.createAndFill()!
    ]))
    const tableNode = state.schema.nodes.table.create(undefined, Fragment.fromArray([tableRowNode]))

    dispatch(tr.replaceSelectionWith(tableNode).scrollIntoView())

    return true
}

function getTableMenus(): MenuElement {
    const menuItemAddTable = { title: "Add table", icon: setIconElement("icon-table"), run: dispatchTable }
    const tableMenu = new MenuItem(menuItemAddTable)

    return tableMenu
}

const contextMenuContainer = document.createElement("div")

function getContextMenuItem(fn: VoidFunction | null, menuName: string, iconName: string | null = null, iconRotate: Number = 0): HTMLElement {
    const contextMenuItem = document.createElement("div") as HTMLElement
    contextMenuItem.className = "ContextMenuItem"

    const menuIcon = document.createElement("i") as HTMLElement
    const menuText = document.createElement("span") as HTMLElement

    menuIcon.setAttribute("class", `${iconName}`)
    if (iconName) { menuIcon.setAttribute("style", `transform: rotate(${iconRotate}deg); display: inline-block;`) }
    menuText.innerText = ` ${menuName}`

    contextMenuItem.appendChild(menuIcon)
    contextMenuItem.appendChild(menuText)

    if (fn != null) {
        contextMenuItem.onclick = () => {
            fn()
            contextMenuContainer.style.display = "none"
        }
    }

    return contextMenuItem
}

function prepareContextMenuItems(view: EditorView) {
    const menuItemAddColumnBefore = getContextMenuItem(() => addColumnBefore(view.state, view.dispatch), "Insert column before", "icon-list-add", 180)
    const menuItemAddColumnAfter = getContextMenuItem(() => addColumnAfter(view.state, view.dispatch), "Insert column after", "icon-list-add")
    const menuItemDeleteColumn = getContextMenuItem(() => deleteColumn(view.state, view.dispatch), "Delete column", "icon-sq-minus")
    const menuItemAddRowBefore = getContextMenuItem(() => addRowBefore(view.state, view.dispatch), "Insert row before", "icon-list-add", 270)
    const menuItemAddRowAfter = getContextMenuItem(() => addRowAfter(view.state, view.dispatch), "Insert row after", "icon-list-add", 90)
    const menuItemDeleteRow = getContextMenuItem(() => deleteRow(view.state, view.dispatch), "Delete row", "icon-window-close-o")
    const menuItemDeleteTable = getContextMenuItem(() => deleteTable(view.state, view.dispatch), "Delete table", "icon-trash-empty")

    const menuItemMergeCells = getContextMenuItem(() => mergeCells(view.state, view.dispatch), "Merge cells", "icon-object-ungroup")
    const menuItemRestoreMergedCell = getContextMenuItem(() => splitCell(view.state, view.dispatch), "Restore merged cell", "icon-undo")

    const menuItemToggleHeaderColumn = getContextMenuItem(() => toggleHeaderColumn(view.state, view.dispatch), "Toggle header column", "icon-header")
    const menuItemToggleHeaderRow = getContextMenuItem(() => toggleHeaderRow(view.state, view.dispatch), "Toggle header row", "icon-header")
    const menuItemToggleHeaderCells = getContextMenuItem(() => toggleHeaderCell(view.state, view.dispatch), "Toggle header cells", "icon-header")

    const menuItemMakeCellGreen = getContextMenuItem(() => (setCellAttr("background", "#dfd"))(view.state, view.dispatch), "Make cell green")
    const menuItemMakeCellRed = getContextMenuItem(() => (setCellAttr("background", "#faa"))(view.state, view.dispatch), "Make cell red")
    const menuItemMakeCellNoColor = getContextMenuItem(() => (setCellAttr("background", null))(view.state, view.dispatch), "Make cell no color")

    const menuItemSplitter = document.createElement("hr") as HTMLElement

    contextMenuContainer.appendChild(menuItemAddColumnBefore)
    contextMenuContainer.appendChild(menuItemAddColumnAfter)
    contextMenuContainer.appendChild(menuItemDeleteColumn)
    contextMenuContainer.appendChild(menuItemAddRowBefore)
    contextMenuContainer.appendChild(menuItemAddRowAfter)
    contextMenuContainer.appendChild(menuItemDeleteRow)
    contextMenuContainer.appendChild(menuItemDeleteTable)

    contextMenuContainer.appendChild(menuItemSplitter.cloneNode())

    contextMenuContainer.appendChild(menuItemMergeCells)
    contextMenuContainer.appendChild(menuItemRestoreMergedCell)

    contextMenuContainer.appendChild(menuItemSplitter.cloneNode())

    contextMenuContainer.appendChild(menuItemToggleHeaderColumn)
    contextMenuContainer.appendChild(menuItemToggleHeaderRow)
    contextMenuContainer.appendChild(menuItemToggleHeaderCells)

    contextMenuContainer.appendChild(menuItemSplitter.cloneNode())

    contextMenuContainer.appendChild(menuItemMakeCellGreen)
    contextMenuContainer.appendChild(menuItemMakeCellRed)
    contextMenuContainer.appendChild(menuItemMakeCellNoColor)
}

function tableContextMenuHandler(): Plugin<any> {
    contextMenuContainer.className = "ContextMenu"
    contextMenuContainer.innerHTML = ""

    const tableCellNodes = ["TH", "TD"]

    const plugin = new Plugin({
        props: {
            handleDOMEvents: {
                mouseup: function (view: EditorView, event: MouseEvent,): void {
                    switch (event.button) {
                        case 0: // Left mouse button
                            contextMenuContainer.style.display = "none"
                            break
                        case 1: // Wheel button
                            break
                        case 2: // Right mouse button
                            break
                    }
                },
                contextmenu: function (view: EditorView, event: MouseEvent,): void {
                    const editorContainer = view.dom.parentElement?.parentElement as HTMLElement
                    const root = view.dom
                    let node = (event.target as HTMLElement)

                    while (node && node != root) {
                        if (tableCellNodes.includes(node.nodeName)) {
                            event.preventDefault()
                            event.stopPropagation()

                            contextMenuContainer.innerHTML = ``
                            contextMenuContainer.style.display = ""

                            prepareContextMenuItems(view)

                            view.dom.parentNode?.appendChild(contextMenuContainer)

                            let px = (event as MouseEvent).clientX
                            let py = (event as MouseEvent).clientY
                            const editorBoundingBox = editorContainer.getBoundingClientRect()
                            const contextBoundingBox = contextMenuContainer.getBoundingClientRect()

                            if ((py + contextBoundingBox.height) > (globalThis as any).innerHeight) {
                                py -= contextBoundingBox.height
                            }

                            contextMenuContainer.style.left = px + "px"
                            contextMenuContainer.style.top = py + "px"

                            break
                        }
                        node = node.parentNode as HTMLElement
                    }
                }
            }
        }
    })

    return plugin
}

export { setTableNodes, getTableMenus, tableContextMenuHandler }