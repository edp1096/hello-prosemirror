import { build } from 'esbuild'

build({
    entryPoints: ["src/myeditor.ts"],
    outfile: "dist/myeditor.js",
    bundle: true,
    minify: true,
    target: "es6",
    define: { "process.env.NODE_ENV": "production" },
    // define: { "process.env.NODE_ENV": "developemnt" },    
})
