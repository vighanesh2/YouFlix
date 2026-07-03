import { useRef } from "react";
import styles from "./CoverUploadField.module.css";

interface Props {
  coverFile: File | null;
  coverPreview: string | null;
  currentCoverUrl?: string;
  onFileChange: (file: File | null) => void;
  onRemoveCustomCover?: () => void;
  disabled?: boolean;
  id?: string;
  showRemoveCustom?: boolean;
}

export default function CoverUploadField({
  coverFile,
  coverPreview,
  currentCoverUrl,
  onFileChange,
  onRemoveCustomCover,
  disabled = false,
  id = "cover-upload",
  showRemoveCustom = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayUrl = coverPreview ?? currentCoverUrl ?? null;

  function clearSelectedFile() {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={styles.section}>
      <label htmlFor={id} className={styles.label}>
        Cover image
      </label>
      <div className={styles.row}>
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,.avif"
          className={styles.fileInput}
          disabled={disabled}
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        {displayUrl ? (
          <div className={styles.previewWrap}>
            <img src={displayUrl} alt="Cover preview" className={styles.preview} />
            <div className={styles.previewActions}>
              {coverFile && (
                <button
                  type="button"
                  className={styles.textBtn}
                  onClick={clearSelectedFile}
                  disabled={disabled}
                >
                  Clear selection
                </button>
              )}
              <button
                type="button"
                className={styles.textBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                Replace image
              </button>
              {showRemoveCustom && onRemoveCustomCover && currentCoverUrl && !coverFile && (
                <button
                  type="button"
                  className={styles.textBtn}
                  onClick={onRemoveCustomCover}
                  disabled={disabled}
                >
                  Use YouTube thumbnail
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            Choose image
          </button>
        )}
      </div>
      <p className={styles.hint}>
        JPEG, PNG, WebP, GIF, or AVIF — max 8 MB. Converted to AVIF for fast
        loading.
      </p>
    </div>
  );
}
