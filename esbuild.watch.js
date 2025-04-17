// import esbuild from "esbuild"
import * as esbuild from "esbuild"
import fs from "fs"


const serveDIR = "serve"
const serveHOST = "127.0.0.1"
const servePORT = 8000


if (!fs.existsSync(serveDIR)) { fs.mkdirSync(serveDIR) }

const arg = process.argv[2]
let sourceHTML = "watchplace/html/js.html"
if (arg == "mjs") { sourceHTML = "watchplace/html/mjs.html" }
fs.copyFile(sourceHTML, `${serveDIR}/index.html`, (err) => { if (err) throw err })


const watchPlugin = {
    name: "watch-plugin",
    setup(build) {
        build.onStart(() => { console.log(`Build start: ${new Date(Date.now()).toLocaleString()}`) })
        build.onEnd((result) => {
            if (result.errors.length > 0) {
                console.log(`Build Finished with errors: ${new Date(Date.now()).toLocaleString()}`)
            } else {
                console.log(`Build Finished successfully: ${new Date(Date.now()).toLocaleString()}`)
            }
        })
    }
}

const ctxConfig = {
    entryPoints: ["src/css/editor.css", "src/myeditor.ts"],
    outdir: serveDIR,
    bundle: true,
    minify: true,
    define: { "process.env.NODE_ENV": "'development'" },
    loader: { ".woff": "dataurl", ".woff2": "dataurl" },
    plugins: [watchPlugin],
    footer: { js: "new EventSource('/esbuild').addEventListener('change', () => location.reload())" },
    sourcemap: "external",
}

if (arg == "mjs") {
    ctxConfig.target = "es2020"
    ctxConfig.format = "esm"
    ctxConfig.outExtension = { ".js": ".mjs" }
}

const ctx = await esbuild.context(ctxConfig)
await ctx.watch()


const serveOptions = {
    servedir: serveDIR,
    host: serveHOST,
    port: servePORT
}

const { host, port } = await ctx.serve(serveOptions)
console.log(`Watching.. http://${serveHOST}:${port}`)

// ctx.dispose()
