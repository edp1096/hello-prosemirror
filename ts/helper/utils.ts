import { IconSpec } from "prosemirror-menu"

function setIconElement(iconName: string): IconSpec {
    const iconEL = document.createElement("i")
    iconEL.setAttribute("class", iconName)
    iconEL.setAttribute("style", "font-size: 1.3em; margin: -0.3em;")

    const result = { dom: iconEL }

    return result
}

export { setIconElement }