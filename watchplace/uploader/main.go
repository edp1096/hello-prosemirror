package main // import "uploader"

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

// https://tutorialedge.net/golang/go-file-upload-tutorial
func uploadFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	r.ParseMultipartForm(100 << 20) // 10 << 20 specifies a maximum upload of 10 MB files

	file, handler, err := r.FormFile("upload-files[]")
	if err != nil {
		fmt.Println("Error Retrieving the File")
		fmt.Println(err)
		return
	}
	defer file.Close()

	// tempFile, err := ioutil.TempFile("../upload", "upload-*-"+handler.Filename)
	tempFile, err := os.CreateTemp("../upload", "upload-*-"+handler.Filename)
	if err != nil {
		fmt.Println(err)
	}
	defer tempFile.Close()

	// fileBytes, err := ioutil.ReadAll(file)
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		fmt.Println(err)
	}
	tempFile.Write(fileBytes)

	resultMAP := map[string]interface{}{
		"files": []map[string]string{
			{
				"message":     "success",
				"filename":    handler.Filename,
				"storagename": filepath.Base(tempFile.Name()),
			},
		},
	}

	result, _ := json.Marshal(resultMAP)

	// fmt.Fprintf(w, string(result))
	fmt.Fprint(w, string(result))
}

func cors(handler http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		handler.ServeHTTP(w, r)
	}
}

func setupRoutes() {
	http.HandleFunc("/upload", uploadFile)
	http.Handle("/files/", cors(http.StripPrefix("/files", http.FileServer(http.Dir("../upload")))))

	http.ListenAndServe("127.0.0.1:8864", nil)
}

func main() {
	fmt.Println("Listening on port http://localhost:8864")
	setupRoutes()
}
