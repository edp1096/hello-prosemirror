import OrderedMap from 'orderedmap'

import { EditorState, Plugin, Transaction } from "prosemirror-state"
import { Schema, DOMParser, DOMSerializer, Fragment, NodeType, NodeSpec } from "prosemirror-model"
import { menuBar, MenuItemSpec, MenuItem, MenuElement, Dropdown } from "prosemirror-menu"
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

function item(label: string, cmd: any) { return new MenuItem({ label, select: cmd, run: cmd }) }

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
                setDOMAttr(value: string, attrs: any): void {
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

// export const mergeTableMenu = (menus: MenuElement[][]): MenuElement[][] => {
//     const tableMenu = [
//         item("Insert column before", addColumnBefore),
//         item("Insert column after", addColumnAfter),
//         item("Delete column", deleteColumn),
//         item("Insert row before", addRowBefore),
//         item("Insert row after", addRowAfter),
//         item("Delete row", deleteRow),
//         item("Delete table", deleteTable),
//         item("Merge cells", mergeCells),
//         item("Split cell", splitCell),
//         item("Toggle header column", toggleHeaderColumn),
//         item("Toggle header row", toggleHeaderRow),
//         item("Toggle header cells", toggleHeaderCell),
//         item("Make cell green", setCellAttr("background", "#dfd")),
//         item("Make cell red", setCellAttr("background", "#faa")),
//         item("Make cell non-green", setCellAttr("background", null))
//     ]
//     const tableDropdown = new Dropdown(tableMenu, { label: "Edit table" })
//     const menuAddTable = new MenuItem({ label: "Add table", run: dispatchTable })

//     menus.push([tableDropdown])
//     menus.push([menuAddTable])

//     return menus
// }

function getTableMenus(): MenuElement[] {
    const dropdownItemsEditTable = [
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
        item("Make cell red", setCellAttr("background", "#faa")),
        item("Make cell non-green", setCellAttr("background", null))
    ]

    const menuItemAddTable = {
        title: "Add table",
        icon: setIconElement("bi-table"),
        run: dispatchTable
    }
    const menuItemEditTable = {
        label: "Edit",
        title: "Edit table",
        icon: setIconElement("bi-pencil-square")
    }

    // const tableMenu = [new MenuItem(menuItemAddTable), new Dropdown(dropdownItemsEditTable, menuItemEditTable)]
    const tableMenu = [new MenuItem(menuItemAddTable)]

    return tableMenu
}

// Context menu
// https://discuss.prosemirror.net/t/make-right-click-on-a-cellselection-area-work-as-expect/2675/3
// https://prosemirror.net/examples/tooltip

const contextMenuContainer = document.createElement("div")

function getContextMenuItem(menuName: string, fn: VoidFunction): HTMLElement {
    const contextMenuItem = document.createElement("div") as HTMLElement
    contextMenuItem.className = "ContextMenuItem"
    contextMenuItem.textContent = menuName
    contextMenuItem.onclick = () => {
        fn()
        contextMenuContainer.style.display = "none"
    }

    return contextMenuItem
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
                            // view.dom.parentNode?.removeChild(menuContainer) // Error when not appeneded so, keep appended
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

                            const menuItemAddColumnBefore = getContextMenuItem("Insert column before", () => addColumnBefore(view.state, view.dispatch))
                            const menuItemAddColumnAfter = getContextMenuItem("Insert column after", () => addColumnAfter(view.state, view.dispatch))
                            const menuItemDeleteColumn = getContextMenuItem("Delete column", () => deleteColumn(view.state, view.dispatch))
                            const menuItemAddRowBefore = getContextMenuItem("Insert row before", () => addRowBefore(view.state, view.dispatch))
                            const menuItemAddRowAfter = getContextMenuItem("Insert row after", () => addRowAfter(view.state, view.dispatch))
                            const menuItemDeleteRow = getContextMenuItem("Delete row", () => deleteRow(view.state, view.dispatch))
                            const menuItemDeleteTable = getContextMenuItem("Delete table", () => deleteTable(view.state, view.dispatch))
                            const menuItemMergeCells = getContextMenuItem("Merge cells", () => mergeCells(view.state, view.dispatch))
                            const menuItemSplitCell = getContextMenuItem("Split cells", () => splitCell(view.state, view.dispatch))
                            const menuItemToggleHeaderColumn = getContextMenuItem("Toggle header column", () => toggleHeaderColumn(view.state, view.dispatch))
                            const menuItemToggleHeaderRow = getContextMenuItem("Toggle header row", () => toggleHeaderRow(view.state, view.dispatch))
                            const menuItemToggleHeaderCells = getContextMenuItem("Toggle header cells", () => toggleHeaderCell(view.state, view.dispatch))
                            const menuItemMakeCellGreen = getContextMenuItem("Make cell green", () => (setCellAttr("background", "#dfd"))(view.state, view.dispatch))
                            const menuItemMakeCellRed = getContextMenuItem("Make cell red", () => (setCellAttr("background", "#faa"))(view.state, view.dispatch))
                            const menuItemMakeCellNoColor = getContextMenuItem("Make cell no color", () => (setCellAttr("background", null))(view.state, view.dispatch))

                            contextMenuContainer.appendChild(menuItemAddColumnBefore)
                            contextMenuContainer.appendChild(menuItemAddColumnAfter)
                            contextMenuContainer.appendChild(menuItemDeleteColumn)
                            contextMenuContainer.appendChild(menuItemAddRowBefore)
                            contextMenuContainer.appendChild(menuItemAddRowAfter)
                            contextMenuContainer.appendChild(menuItemDeleteRow)
                            contextMenuContainer.appendChild(menuItemDeleteTable)
                            contextMenuContainer.appendChild(menuItemMergeCells)
                            contextMenuContainer.appendChild(menuItemSplitCell)
                            contextMenuContainer.appendChild(menuItemToggleHeaderColumn)
                            contextMenuContainer.appendChild(menuItemToggleHeaderRow)
                            contextMenuContainer.appendChild(menuItemToggleHeaderCells)
                            contextMenuContainer.appendChild(menuItemMakeCellGreen)
                            contextMenuContainer.appendChild(menuItemMakeCellRed)
                            contextMenuContainer.appendChild(menuItemMakeCellNoColor)

                            contextMenuContainer.style.display = ""
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

                            // // Test - Insert column before
                            // addColumnBefore(view.state, view.dispatch);
                            // (setCellAttr("background", "#faa"))(view.state, view.dispatch)

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