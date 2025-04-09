import { Schema, NodeSpec, MarkSpec, DOMOutputSpec } from "prosemirror-model"


const pDOM: DOMOutputSpec = ["p", 0],
    blockquoteDOM: DOMOutputSpec = ["blockquote", 0],
    hrDOM: DOMOutputSpec = ["hr"],
    preDOM: DOMOutputSpec = ["pre", ["code", 0]],
    brDOM: DOMOutputSpec = ["br"]

export const nodes = {
    doc: { content: "block+" } as NodeSpec,
    paragraph: {
        group: "block",
        content: "inline*",
        parseDOM: [{ tag: "p" }],
        toDOM() { return pDOM }
    } as NodeSpec,
    blockquote: {
        group: "block",
        content: "block+",
        defining: true,
        parseDOM: [{ tag: "blockquote" }],
        toDOM() { return blockquoteDOM }
    } as NodeSpec,
    horizontal_rule: {
        group: "block",
        parseDOM: [{ tag: "hr" }],
        toDOM() { return hrDOM }
    } as NodeSpec,
    heading: {
        group: "block",
        content: "inline*",
        attrs: {
            tagName: { default: "h1" },
            level: { default: 1 }
        },
        defining: true,
        parseDOM: [
            { tag: "h1", attrs: { level: 1 } },
            { tag: "h2", attrs: { level: 2 } },
            { tag: "h3", attrs: { level: 3 } },
            { tag: "h4", attrs: { level: 4 } },
            { tag: "h5", attrs: { level: 5 } },
            { tag: "h6", attrs: { level: 6 } }
        ],
        toDOM(node) { return ["h" + node.attrs.level, 0] }
    } as NodeSpec,
    code_block: {
        content: "text*",
        marks: "",
        group: "block",
        code: true,
        defining: true,
        parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
        toDOM() { return preDOM }
    } as NodeSpec,
    text: { group: "inline" } as NodeSpec,
    image: {
        inline: true,
        attrs: {
            src: {},
            alt: { default: null },
            title: { default: null },
            animate: { default: null }
        },
        group: "inline",
        draggable: true,
        parseDOM: [{
            tag: "img[src]", getAttrs(dom: HTMLElement) {
                return {
                    src: dom.getAttribute("src"),
                    title: dom.getAttribute("title"),
                    alt: dom.getAttribute("alt"),
                    animate: dom.getAttribute("animate")
                }
            }
        }],
        toDOM(node) { let { src, alt, title, animate } = node.attrs; return ["img", { src, alt, title, animate }] }
    } as NodeSpec,
    hard_break: {
        inline: true,
        group: "inline",
        selectable: false,
        parseDOM: [{ tag: "br" }],
        toDOM() { return brDOM }
    } as NodeSpec
}

const emDOM: DOMOutputSpec = ["em", 0], strongDOM: DOMOutputSpec = ["strong", 0], codeDOM: DOMOutputSpec = ["code", 0]

export const marks = {
    link: {
        attrs: {
            href: {},
            title: { default: null }
        },
        inclusive: false,
        parseDOM: [{
            tag: "a[href]", getAttrs(dom: HTMLElement) {
                return { href: dom.getAttribute("href"), title: dom.getAttribute("title") }
            }
        }],
        toDOM(node) { let { href, title } = node.attrs; return ["a", { href, title, target: "_blank" }, 0] }
    } as MarkSpec,
    em: {
        parseDOM: [
            { tag: "i" }, { tag: "em" },
            { style: "font-style=italic" },
            { style: "font-style=normal", clearMark: m => m.type.name == "em" }
        ],
        toDOM() { return emDOM }
    } as MarkSpec,
    strong: {
        parseDOM: [
            { tag: "strong" },
            { tag: "b", getAttrs: (node: HTMLElement) => node.style.fontWeight != "normal" && null },
            { style: "font-weight=400", clearMark: m => m.type.name == "strong" },
            { style: "font-weight", getAttrs: (value: string) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null },
        ],
        toDOM() { return strongDOM }
    } as MarkSpec,
    code: {
        parseDOM: [{ tag: "code" }],
        toDOM() { return codeDOM }
    } as MarkSpec,
    strike: {
        parseDOM: [{ tag: "s" }, { tag: "del" }],
        // parseDOM: [{ tag: "s" }],
        toDOM() { return ["s", 0] }
    } as MarkSpec,
    underline: {
        parseDOM: [{ tag: "u" }],
        toDOM() { return ["u", { style: "text-decoration: underline" }, 0] }
    } as MarkSpec
}

export const schema = new Schema({ nodes, marks })