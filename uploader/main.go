package main // import "uploader"

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"path/filepath"
)

// https://tutorialedge.net/golang/go-file-upload-tutorial
func uploadFile(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(100 << 20) // 10 << 20 specifies a maximum upload of 10 MB files

	file, handler, err := r.FormFile("file")
	if err != nil {
		fmt.Println("Error Retrieving the File")
		fmt.Println(err)
		return
	}
	defer file.Close()

	tempFile, err := ioutil.TempFile("../upload", "upload-*-"+handler.Filename)
	if err != nil {
		fmt.Println(err)
	}
	defer tempFile.Close()

	fileBytes, err := ioutil.ReadAll(file)
	if err != nil {
		fmt.Println(err)
	}
	tempFile.Write(fileBytes)

	resultMAP := map[string]string{
		"message":   "success",
		"filename":  handler.Filename,
		"storename": filepath.Base(tempFile.Name()),
	}

	result, _ := json.Marshal(resultMAP)

	fmt.Fprintf(w, string(result))
}

func setupRoutes() {
	http.HandleFunc("/upload", uploadFile)
	http.Handle("/files/", http.StripPrefix("/files", http.FileServer(http.Dir("../upload"))))

	http.ListenAndServe("127.0.0.1:8864", nil)
}

func main() {
	fmt.Println("Listening on port http://localhost:8864")
	setupRoutes()
}
