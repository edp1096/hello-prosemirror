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
    menuContainer.innerHTML = "hahaha"

    const plugin = new Plugin({
        props: {
            handleDOMEvents: {
                mouseup: function (view: EditorView, event: MouseEvent,): void {
                    const root = view.dom
                    let node = (event.target as HTMLElement)

                    if (event.button == 2) {
                        while (node && node != root) {
                            if (node.nodeName === 'TD' || node.nodeName === 'TH') {
                                const $targetPos = view.state.doc.resolve(view.posAtDOM(node, 0))
                                const pos = view.posAtCoords({ left: (event as MouseEvent).clientX, top: (event as MouseEvent).clientY })
                                event.preventDefault()
                                event.stopPropagation()

                                menuContainer.style.left = `${pos?.pos}`
                                menuContainer.style.top = `${pos?.pos}`
                                view.dom.parentNode?.appendChild(menuContainer)

                                menuContainer.style.display = ""
                                let { from, to } = view.state.selection
                                
                                let start = view.coordsAtPos(from), end = view.coordsAtPos(to) // These are in screen coordinates
                                let box = menuContainer!.offsetParent!.getBoundingClientRect() // The box in which the tooltip is positioned, to use as base

                                // Find a center-ish x position from the selection endpoints (when
                                // crossing lines, end may be more to the left)
                                let left = Math.max((start.left + end.left) / 2, start.left + 3)
                                menuContainer.style.left = (left - box.left) + "px"
                                menuContainer.style.bottom = (box.bottom - start.top) + "px"
                                menuContainer.textContent = String(to - from)

                                console.log("haha", node.nodeName, pos)
                                break
                            }
                            node = node.parentNode as HTMLElement
                        }
                    }
                }
            }
        }
    })

    return plugin
}

export { setTableNodes, getTableMenus, tableContextMenuHandler }