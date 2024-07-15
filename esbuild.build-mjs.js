import { build } from "esbuild"
import { PluginGZ } from "./esbuild.plugins.js"

build({
    entryPoints: ["src/myeditor.ts"],
    outfile: "dist/myeditor.mjs",
    bundle: true,
    minify: true,
    sourcemap: true,
    target: "es2020",
    format: "esm",
    define: { "process.env.NODE_ENV": "'production'" },
    // define: { "process.env.NODE_ENV": "'developemnt'" },
    // write: false,
    // plugins: [PluginGZ()]
})
