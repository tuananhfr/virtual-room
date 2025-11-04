import { useState } from "react";

type UploadMode = "url" | "file";

/**
 * Component để chọn giữa URL hoặc upload file local
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentUrl,
  onImageUploaded,
  label = "Panorama Image",
}) => {
  const [mode, setMode] = useState<UploadMode>("url");
  const [previewUrl, setPreviewUrl] = useState<string>(currentUrl || "");

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("File too large! Maximum size is 10MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url: string = event.target!.result as string;
      setPreviewUrl(base64Url);
      if (onImageUploaded) {
        onImageUploaded(base64Url);
      }
    };
    reader.onerror = () => {
      alert("Error reading file");
    };
    reader.readAsDataURL(file);
  };

  // Handle URL input
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPreviewUrl(url);
    if (onImageUploaded) {
      onImageUploaded(url);
    }
  };

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}:</label>

      {/* Mode Toggle */}
      <div className="btn-group w-100 mb-2" role="group">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`btn ${mode === "url" ? "btn-primary" : "btn-outline-primary"}`}
        >
          <i className="bi bi-link-45deg me-1"></i>
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`btn ${mode === "file" ? "btn-primary" : "btn-outline-primary"}`}
        >
          <i className="bi bi-folder me-1"></i>
          Local File
        </button>
      </div>

      {/* URL Input */}
      {mode === "url" && (
        <div>
          <input
            type="text"
            className="form-control"
            placeholder="https://example.com/panorama.jpg"
            value={previewUrl}
            onChange={handleUrlChange}
          />
          <small className="form-text text-muted">
            Enter URL of panorama image (aspect ratio 2:1 recommended)
          </small>
        </div>
      )}

      {/* File Upload */}
      {mode === "file" && (
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
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="mt-3 p-2 bg-light border rounded">
          <div className="small fw-semibold text-secondary mb-2">Preview:</div>
          <img
            src={previewUrl}
            alt="Panorama preview"
            className="img-fluid rounded"
            style={{ maxHeight: "150px", objectFit: "cover" }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const nextSibling = target.nextElementSibling as HTMLElement;
              if (nextSibling) {
                nextSibling.style.display = "block";
              }
            }}
          />
          <div className="text-danger text-center py-3" style={{ display: "none" }}>
            <i className="bi bi-x-circle me-1"></i>
            Failed to load image. Please check the URL or file.
          </div>
          <div className="small text-muted text-center mt-2">
            {mode === "file" ? (
              <>
                <i className="bi bi-folder me-1"></i>
                Local file (Base64)
              </>
            ) : (
              <>
                <i className="bi bi-link-45deg me-1"></i>
                External URL
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
