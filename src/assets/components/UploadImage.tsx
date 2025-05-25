import { useEffect, useRef, useState } from "react";
import Croppie from "croppie";
import "croppie/croppie.css";
import { upload } from "../services/api";

function UploadImage({ isUploadShown, setIsUploadShown }) {
  const [droppedFiles, setDroppedFiles] = useState([]);
  const croppieInstance = useRef(null);
  const croppieContainerRef = useRef();

  const handleClickWrapper = (e) => {
    if (e.target.id === "uploadImageWrapper") {
      setIsUploadShown(false);
      setDroppedFiles([]);
    }
  };

  const dragOverHandler = (ev) => ev.preventDefault();

  const dropHandler = (ev) => {
    ev.preventDefault();
    const files = ev.dataTransfer.files;
    if (files.length > 0) {
      setDroppedFiles([files[0]]);
    }
  };

  useEffect(() => {
    if (droppedFiles.length === 0 || !croppieContainerRef.current) return;

    const file = droppedFiles[0];
    const reader = new FileReader();

    reader.onload = () => {
      if (croppieInstance.current) {
        croppieInstance.current.destroy();
      }

      const c = new Croppie(croppieContainerRef.current, {
        showZoomer: true,
        enableOrientation: true,
        mouseWheelZoom: true,
        viewport: { width: 200, height: 200, type: "circle" },
        boundary: { width: 400, height: 300 },
      });

      croppieInstance.current = c;

      c.bind({ url: reader.result });
    };

    reader.readAsDataURL(file);
  }, [droppedFiles]);

  const handleUpload = async () => {
    if (!croppieInstance.current) return;

    try {
      const base64 = await croppieInstance.current.result({
        type: "base64",
        size: "viewport",
      });

      const blob = await (await fetch(base64)).blob();

      const formData = new FormData();
      formData.append("file", blob, "cropped.png");

      const token = sessionStorage.getItem("token");
      if (!token) {
        console.error("No token found in session storage!");
        return;
      }

      const response = await upload(formData);
      const json = await response.json();
      console.log("Upload response:", json);

      croppieInstance.current?.destroy();
      croppieInstance.current = null;
      setDroppedFiles([]);
      setIsUploadShown(false);
    } catch (err) {
      console.error("Error uploading image:", err);
    }
  };
  return (
    <>
      {isUploadShown && (
        <div
          id="uploadImageWrapper"
          className="fixed inset-0 bg-[rgba(0,0,0,0.8)] flex items-center justify-center z-50 !rounded-none"
          onClick={handleClickWrapper}
          onDragOver={dragOverHandler}
          onDrop={dropHandler}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[500px] max-w-3xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold text-gray-700">
              Upload Image
            </h2>

            <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg min-h-[320px] flex items-center justify-center text-center">
              {droppedFiles.length > 0 ? (
                <div ref={croppieContainerRef}></div>
              ) : (
                <p className="text-gray-400 text-xl font-medium">
                  Drag and drop your image here
                </p>
              )}
            </div>

            {droppedFiles.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  className="bg-green-600 text-white text-lg px-6 py-3 rounded-xl hover:bg-green-700 transition"
                >
                  Upload
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default UploadImage;
