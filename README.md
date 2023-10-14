# Taste ProseMirror

[Page](https://edp1096.github.io/hello-prosemirror) - Require own server for upload testing

## CDN
* https://cdn.jsdelivr.net/gh/edp1096/hello-prosemirror/dist/myeditor.js
* https://cdn.jsdelivr.net/gh/edp1096/hello-prosemirror/dist/myeditor.mjs
* https://cdn.jsdelivr.net/gh/edp1096/hello-prosemirror/dist/myeditor.map
* https://cdn.jsdelivr.net/gh/edp1096/hello-prosemirror/dist/myeditor.css

## Build

```powershell
yarn all # All
yarn js  # Browser JS
yarn mjs # Module
yarn css # CSS
```

## Watch

* Browser JS
```powershell
yarn watch     # MJS as default
yarn watch mjs # MJS
yarn watch js  # JS
```

## Run Uploader
```powershell
cd watchplace/uploader
./run.cmd
```

## Source
* https://prosemirror.net/examples/basic
* https://github.com/ProseMirror/prosemirror-example-setup
