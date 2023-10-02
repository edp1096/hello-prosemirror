import OrderedMap from 'orderedmap'

import { EditorState } from "prosemirror-state"
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

    // Context menu - https://prosemirror.net/examples/tooltip



    const tableMenu = [
        new MenuItem(menuItemAddTable),
        new MenuItem({ title: "Delete table", icon: setIconElement("bi-file-excel"), select: deleteTable, run: deleteTable }),
        new Dropdown(dropdownItemsEditTable, menuItemEditTable),
    ]

    return tableMenu
}

export { setTableNodes, getTableMenus }