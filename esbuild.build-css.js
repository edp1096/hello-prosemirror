import { buildSync } from 'esbuild'

buildSync({
    entryPoints: ["css/editor.css"],
    outfile: "dist/editor.css",
    bundle: true,
    minify: true
})
