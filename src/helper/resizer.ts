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

                const iframes = container.querySelectorAll("iframe")
                iframes.forEach((iframe: HTMLIFrameElement) => {
                    iframe.style.pointerEvents = 'none'
                })

                startY = e.clientY
                // startHeight = editorView.dom.offsetHeight
                startHeight = container.offsetHeight
                document.addEventListener('mousemove', onMouseMove, { passive: true })
                document.addEventListener('mouseup', onMouseUp)
            }

            function onMouseMove(e: MouseEvent) {
                const diff = e.clientY - startY
                // editorView.dom.style.height = `${startHeight + diff}px`
                container.style.height = `${startHeight + diff}px`
            }

            function onMouseUp() {
                const iframes = container.querySelectorAll("iframe")
                iframes.forEach((iframe: HTMLIFrameElement) => {
                    iframe.style.pointerEvents = 'unset'
                })

                document.removeEventListener('mousemove', onMouseMove)
                document.removeEventListener('mouseup', onMouseUp)
            }

            resizeBar.addEventListener('mousedown', onMouseDown)

            function onTouchStart(e: TouchEvent) {
                e.preventDefault()
                startY = e.touches[0].clientY
                // startHeight = editorView.dom.offsetHeight
                startHeight = container.offsetHeight
                document.addEventListener('touchmove', onTouchMove)
                document.addEventListener('touchend', onTouchEnd)
            }

            function onTouchMove(e: TouchEvent) {
                const diff = e.touches[0].clientY - startY
                // editorView.dom.style.height = `${startHeight + diff}px`
                container.style.height = `${startHeight + diff}px`
            }

            function onTouchEnd() {
                document.removeEventListener('touchmove', onTouchMove)
                document.removeEventListener('touchend', onTouchEnd)
            }

            resizeBar.addEventListener('touchstart', onTouchStart)

            return {
                destroy() {
                    resizeBar.removeEventListener('mousedown', onMouseDown)
                    resizeBar.removeEventListener('touchstart', onTouchStart)
                    resizeBar.remove()
                }
            }
        }
    })
}

export { resizePluginKey, createResizePlugin }