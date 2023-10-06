import OrderedMap from 'orderedmap'

import { EditorState, Plugin } from "prosemirror-state"
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

    const tableMenu = [
        new MenuItem(menuItemAddTable),
        // new MenuItem({ title: "Delete table", icon: setIconElement("bi-file-excel"), select: deleteTable, run: deleteTable }),
        new Dropdown(dropdownItemsEditTable, menuItemEditTable),
    ]

    return tableMenu
}

// Context menu
// https://discuss.prosemirror.net/t/make-right-click-on-a-cellselection-area-work-as-expect/2675/3
// https://prosemirror.net/examples/tooltip
function tableContextMenuHandler(): Plugin<any> {
    const menuContainer = document.createElement("div")
    menuContainer.className = "ContextMenu"
    menuContainer.innerHTML = "<p>a</p><p>a</p><p>a</p><p>Hello</p>"

    const plugin = new Plugin({
        props: {
            handleDOMEvents: {
                mouseup: function (view: EditorView, event: MouseEvent,): void {
                    switch (event.button) {
                        case 0: // Left mouse button
                            menuContainer.style.display = "none"
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
                        if (node.nodeName === 'TD' || node.nodeName === 'TH') {
                            event.preventDefault()
                            event.stopPropagation()

                            menuContainer.style.display = ""
                            view.dom.parentNode?.appendChild(menuContainer)

                            let px = (event as MouseEvent).clientX
                            let py = (event as MouseEvent).clientY
                            const editorBoundingBox = editorContainer.getBoundingClientRect()
                            const contextBoundingBox = menuContainer.getBoundingClientRect()

                            if ((py + contextBoundingBox.height) > (globalThis as any).innerHeight) {
                                py -= contextBoundingBox.height
                            }

                            menuContainer.style.left = px + "px"
                            menuContainer.style.top = py + "px"

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