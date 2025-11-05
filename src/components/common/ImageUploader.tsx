import { useState, useEffect } from "react";

// Component upload ảnh panorama
const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUploaded,
  label = "Panorama Image",
  currentUrl = "",
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentUrl);

  useEffect(() => {
    setPreviewUrl(currentUrl);
  }, [currentUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // check file có phải ảnh không
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    // giới hạn 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File too large! Maximum size is 10MB");
      return;
    }

    // đọc file thành base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url: string = event.target!.result as string;
      setPreviewUrl(base64Url);
      onImageUploaded(base64Url);
    };
    reader.onerror = () => {
      alert("Error reading file");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    onImageUploaded("");
  };

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}:</label>

      {previewUrl && (
        <div className="mb-3">
          <div className="border rounded p-2 bg-light position-relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="img-fluid rounded"
              style={{ maxHeight: "200px", width: "100%", objectFit: "cover" }}
            />
            <button
              type="button"
              className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
              style={{
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              title="Remove image"
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
          <small className="text-success d-block mt-1">
            <i className="bi bi-check-circle-fill me-1"></i>
            Image uploaded successfully
          </small>
        </div>
      )}

      <div>
        <label className="btn btn-outline-primary w-100 border-2 border-dashed py-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="d-none"
          />
          <i className="bi bi-upload me-2"></i>
          Choose Image File
        </label>
        <small className="form-text text-muted d-block mt-1">
          Upload local image (max 10MB, JPG/PNG, 2:1 ratio recommended)
        </small>
      </div>
    </div>
  );
};

export default ImageUploader;
