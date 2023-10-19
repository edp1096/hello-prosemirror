import { build } from "esbuild"
import { PluginGZ } from "./esbuild.plugins.js"

build({
    entryPoints: ["src/myeditor.ts"],
    outfile: "dist/myeditor.js",
    bundle: true,
    minify: true,
    target: "es6",
    define: { "process.env.NODE_ENV": "production" },
    // define: { "process.env.NODE_ENV": "developemnt" },
    // write: false,
    // plugins: [PluginGZ()]
})
