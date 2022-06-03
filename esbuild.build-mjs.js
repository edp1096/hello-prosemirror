import { build } from 'esbuild'

build({
    entryPoints: ["ts/myeditor.ts"],
    bundle: true,
    outfile: "dist/myeditor.mjs",
    minify: true,
    sourcemap: true,
    target: "es2020",
    format: "esm",
    define: { "process.env.NODE_ENV": "production" },
    // define: { "process.env.NODE_ENV": "developemnt" },
})
