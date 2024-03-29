import { buildSync } from 'esbuild'

const outName = "myeditor"

buildSync({
    entryPoints: ["src/css/editor.css"],
    outfile: `dist/${outName}.css`,
    bundle: true,
    minify: true,
    loader: { ".woff": "dataurl", ".woff2": "dataurl" }
})
