import { Plugin, PluginKey } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

const resizePluginKey = new PluginKey('resize')

function createResizePlugin(): Plugin<any> {
    return new Plugin({
        key: resizePluginKey,
        view(editorView) {
            const resizeBar = document.createElement('div')
            resizeBar.className = 'ProseMirror-resize-bar'
            editorView.dom.parentNode?.appendChild(resizeBar)

            const container = editorView.dom.parentElement?.parentElement!

            let startY: number
            let startHeight: number

            function onMouseDown(e: MouseEvent) {
                e.preventDefault()
                startY = e.clientY
                // startHeight = editorView.dom.offsetHeight
                startHeight = container.offsetHeight
                document.addEventListener('mousemove', onMouseMove)
                document.addEventListener('mouseup', onMouseUp)
            }

            function onMouseMove(e: MouseEvent) {
                const diff = e.clientY - startY
                // editorView.dom.style.height = `${startHeight + diff}px`
                container.style.height = `${startHeight + diff}px`
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove)
                document.removeEventListener('mouseup', onMouseUp)
            }

            resizeBar.addEventListener('mousedown', onMouseDown)

            return {
                destroy() {
                    resizeBar.removeEventListener('mousedown', onMouseDown)
                    resizeBar.remove()
                }
            }
        }
    })
}

export { resizePluginKey, createResizePlugin }