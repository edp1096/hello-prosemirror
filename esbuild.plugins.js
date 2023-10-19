
import { mkdirSync, writeFileSync } from "fs"
import { dirname, basename, extname } from "path"
import { gzipSync } from "zlib"

const PluginGZ = () => ({
    name: "gzip-plugin",
    setup: (build) => {
        if (build.initialOptions.write != false) { throw Error("Check 'write: false' in build option.") }

        build.onEnd(async (result) => {
            const outputFiles = await Promise.all(
                result.outputFiles.map(async (finfo) => {
                    const fname = finfo.path
                    const fdata = finfo.contents

                    mkdirSync(dirname(fname), { recursive: true })

                    writeFileSync(fname, fdata)
                    writeFileSync(`${fname}.gz`, gzipSync(fdata, { level: 9 }))
                })
            )
        })
    }
})

export { PluginGZ }