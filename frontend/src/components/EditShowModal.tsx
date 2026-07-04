import { FormEvent, useEffect, useState } from "react";
import {
  deletePlaylist,
  updatePlaylist,
  type ImportShowDetails,
  type Playlist,
} from "../api/client";
import {
  playlistToEditDetails,
  playlistToPlaceholders,
} from "../utils/showForm";
import { getPlaylistCover } from "../utils/playlistCover";
import { getShowTitle, getShowSeriesLabel } from "../utils/showMetadata";
import CoverUploadField from "./CoverUploadField";
import ShowDetailsForm from "./ShowDetailsForm";
import styles from "./EditShowModal.module.css";

interface Props {
  show: Playlist;
  onClose: () => void;
  onSaved: (updated: Playlist) => void;
  onRemoved?: (playlistId: string) => void;
}

export default function EditShowModal({
  show,
  onClose,
  onSaved,
  onRemoved,
}: Props) {
  const [details, setDetails] = useState<ImportShowDetails>(() =>
    playlistToEditDetails(show)
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholders = playlistToPlaceholders(show);
  const currentCover = removeCover ? "" : getPlaylistCover(show);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(coverFile);
    setCoverPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [coverFile]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving && !removing) onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, saving, removing]);

  function updateDetail(key: keyof ImportShowDetails, value: string) {
    setDetails((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  }

  function handleCoverChange(file: File | null) {
    setCoverFile(file);
    if (file) setRemoveCover(false);
    if (error) setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updated = await updatePlaylist(show.id, details, {
        cover: coverFile,
        removeCover,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    const kind = show.contentType === "movie" ? "movie" : "show";
    const confirmed = window.confirm(
      `Remove "${getShowTitle(show)}" from your library? This cannot be undone.`
    );
    if (!confirmed) return;

    setRemoving(true);
    setError(null);

    try {
      await deletePlaylist(show.id);
      onRemoved?.(show.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to remove ${kind}`);
    } finally {
      setRemoving(false);
    }
  }

  const busy = saving || removing;

  return (
    <div className={styles.overlay} onClick={() => !busy && onClose()}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-show-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{getShowSeriesLabel(show)}</p>
            <h2 id="edit-show-title" className={styles.title}>
              Edit {getShowTitle(show)}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <ShowDetailsForm
            details={details}
            onChange={updateDetail}
            disabled={busy}
            idPrefix={`edit-${show.id}`}
            placeholders={placeholders}
            intro="Clear a field to fall back to the YouTube default shown as placeholder."
          />

          <CoverUploadField
            id={`edit-cover-${show.id}`}
            coverFile={coverFile}
            coverPreview={coverPreview}
            currentCoverUrl={currentCover || undefined}
            onFileChange={handleCoverChange}
            onRemoveCustomCover={() => {
              setRemoveCover(true);
              setCoverFile(null);
            }}
            showRemoveCustom={Boolean(show.coverUrl)}
            disabled={busy}
          />

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.removeBtn}
              onClick={handleRemove}
              disabled={busy}
            >
              {removing ? "Removing…" : "Remove from library"}
            </button>
            <div className={styles.actionsEnd}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={busy}
              >
                Cancel
              </button>
              <button type="submit" className={styles.saveBtn} disabled={busy}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
