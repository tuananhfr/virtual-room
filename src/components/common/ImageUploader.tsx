import { useState, useEffect } from "react";

/**
 * Component để upload file image local
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUploaded,
  label = "Panorama Image",
  currentUrl = "",
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentUrl);

  // Update preview when currentUrl changes
  useEffect(() => {
    setPreviewUrl(currentUrl);
  }, [currentUrl]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      onImageUploaded(base64Url);
    };
    reader.onerror = () => {
      alert("Error reading file");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}:</label>

      {/* Image Preview */}
      {previewUrl && (
        <div className="mb-3">
          <div className="border rounded p-2 bg-light">
            <img
              src={previewUrl}
              alt="Preview"
              className="img-fluid rounded"
              style={{ maxHeight: "200px", width: "100%", objectFit: "cover" }}
            />
          </div>
          <small className="text-success d-block mt-1">
            <i className="bi bi-check-circle-fill me-1"></i>
            Image uploaded successfully
          </small>
        </div>
      )}

      {/* File Upload */}
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
