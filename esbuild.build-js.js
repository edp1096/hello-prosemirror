import { build } from 'esbuild'

build({
    entryPoints: ["ts/myeditor.ts"],
    bundle: true,
    outfile: "dist/myeditor.js",
    minify: true,
    target: "es6",
    define: { "process.env.NODE_ENV": "production" },
    // define: { "process.env.NODE_ENV": "developemnt" },    
})
