import { build } from 'esbuild'

build({
    entryPoints: ["ts/myeditor.ts"],
    outfile: "dist/myeditor.mjs",
    bundle: true,
    minify: true,
    sourcemap: true,
    target: "es2020",
    format: "esm",
    define: { "process.env.NODE_ENV": "production" },
    // define: { "process.env.NODE_ENV": "developemnt" },
})
