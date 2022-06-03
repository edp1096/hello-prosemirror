import { build } from 'esbuild'

build({
    entryPoints: ["ts/list-renderer.ts"],
    bundle: true,
    outfile: "dist/list-renderer.js",
    minify: true,
    target: "es6",
    define: { "process.env.NODE_ENV": "production" },
    // define: { "process.env.NODE_ENV": "developemnt" },    
})
