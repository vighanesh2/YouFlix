import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  deletePlaylist,
  importPlaylist,
  pollImportJob,
  type ImportShowDetails,
  type Playlist,
} from "../api/client";
import CoverUploadField from "../components/CoverUploadField";
import EditShowModal from "../components/EditShowModal";
import LazyPoster from "../components/LazyPoster";
import NavBar from "../components/NavBar";
import ShowDetailsForm from "../components/ShowDetailsForm";
import { usePlaylists } from "../hooks/usePlaylists";
import { getPlaylistCover } from "../utils/playlistCover";
import { getShowSeriesLabel, getShowTitle } from "../utils/showMetadata";
import { isValidYouTubeImportUrl } from "../utils/youtubeImport";
import styles from "./MyNetflixPage.module.css";

const emptyDetails: ImportShowDetails = {
  title: "",
  channelTitle: "",
  year: "",
  seriesLabel: "",
  rating: "",
  description: "",
};

export default function MyNetflixPage() {
  const navigate = useNavigate();
  const {
    playlists,
    loading: loadingLibrary,
    error: libraryError,
    refresh,
    setPlaylists,
  } = usePlaylists();
  const [editingShow, setEditingShow] = useState<Playlist | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [details, setDetails] = useState<ImportShowDetails>(emptyDetails);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(coverFile);
    setCoverPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [coverFile]);

  function updateDetail(key: keyof ImportShowDetails, value: string) {
    setDetails((prev) => ({ ...prev, [key]: value }));
    if (importError) setImportError(null);
  }

  function handleShowSaved(updated: Playlist) {
    setPlaylists((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  }

  function handleShowRemoved(playlistId: string) {
    setPlaylists((prev) => prev.filter((item) => item.id !== playlistId));
    setEditingShow((current) =>
      current?.id === playlistId ? null : current
    );
  }

  async function handleRemove(show: Playlist) {
    const label = getShowTitle(show);
    const kind = show.contentType === "movie" ? "movie" : "show";
    const confirmed = window.confirm(
      `Remove "${label}" from your library? This cannot be undone.`
    );
    if (!confirmed) return;

    setRemovingId(show.id);
    try {
      await deletePlaylist(show.id);
      handleShowRemoved(show.id);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : `Failed to remove ${kind}`
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function handleImport(e: FormEvent) {
    e.preventDefault();
    setImportError(null);
    setImportStatus(null);

    if (!isValidYouTubeImportUrl(url)) {
      setImportError("Enter a valid YouTube playlist or video link.");
      return;
    }

    setImporting(true);
    setImportStatus("Starting import…");

    try {
      const result = await importPlaylist(url, coverFile, details);

      if (result.status === "ALREADY_IMPORTED" && result.playlistId) {
        await refresh();
        navigate(`/show/${result.playlistId}`);
        return;
      }

      if (!result.jobId) {
        throw new Error("No import job returned");
      }

      setImportStatus("Fetching videos from YouTube…");

      const job = await pollImportJob(result.jobId, (progress) => {
        if (progress.status === "PROCESSING") {
          const imported = progress.totalVideosImported;
          const found = progress.totalVideosFound;
          if (found > 0) {
            setImportStatus(`Importing… ${imported}/${found}`);
          } else {
            setImportStatus("Fetching videos from YouTube…");
          }
        }
      });

      if (!job.playlistId) {
        throw new Error("Import completed but no show was created");
      }

      setUrl("");
      setDetails(emptyDetails);
      setCoverFile(null);
      await refresh();
      navigate(`/show/${job.playlistId}`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      setImportStatus(null);
    }
  }

  const showImportError = importError !== null;
  const isValidUrl = url.trim().length > 0 && isValidYouTubeImportUrl(url);

  return (
    <div className={styles.page}>
      <div className={styles.heroBg} aria-hidden />
      <NavBar />

      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <h1 className={styles.title}>My Netflix</h1>
          <p className={styles.subtitle}>
            Manage your shows and movies, or add something new from YouTube.
          </p>
        </header>

        <section className={styles.librarySection}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Your library</h2>
            <span className={styles.count}>
              {playlists.length} title{playlists.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loadingLibrary && (
            <p className={styles.status}>Loading your library…</p>
          )}
          {libraryError && <p className={styles.error}>{libraryError}</p>}

          {!loadingLibrary && !libraryError && playlists.length === 0 && (
            <div className={styles.emptyLibrary}>
              <p>No shows or movies yet. Add your first one below.</p>
            </div>
          )}

          {!loadingLibrary && !libraryError && playlists.length > 0 && (
            <div className={styles.libraryGrid}>
              {playlists.map((show) => {
                const cover = getPlaylistCover(show);
                const showTitle = getShowTitle(show);

                return (
                  <article key={show.id} className={styles.libraryCard}>
                    <Link to={`/show/${show.id}`} className={styles.posterLink}>
                      {cover ? (
                        <LazyPoster
                          src={cover}
                          alt={showTitle}
                          className={styles.posterFrame}
                          imgClassName={styles.posterImg}
                        />
                      ) : (
                        <div className={styles.posterPlaceholder} />
                      )}
                      <span className={styles.typeBadge}>
                        {getShowSeriesLabel(show).toUpperCase()}
                      </span>
                    </Link>

                    <div className={styles.cardBody}>
                      <Link to={`/show/${show.id}`} className={styles.cardTitle}>
                        {showTitle}
                      </Link>
                      <p className={styles.cardMeta}>
                        {show.contentType === "movie"
                          ? "Movie"
                          : `${show.videoCount} episode${show.videoCount !== 1 ? "s" : ""}`}
                      </p>
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={() => setEditingShow(show)}
                        >
                          Edit details
                        </button>
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => handleRemove(show)}
                          disabled={removingId === show.id}
                        >
                          {removingId === show.id ? "Removing…" : "Remove"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.importSection}>
          <h2 className={styles.sectionTitle}>Add new</h2>
          <p className={styles.importIntro}>
            Paste a YouTube playlist for a series, or a single video for a
            movie.
          </p>

          <form className={styles.form} onSubmit={handleImport} noValidate>
            <div className={styles.inputRow}>
              <input
                id="playlist-url"
                type="url"
                className={`${styles.input} ${showImportError ? styles.inputError : ""}`}
                placeholder="https://www.youtube.com/playlist?list=... or watch?v=..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (importError) setImportError(null);
                }}
                autoComplete="off"
                spellCheck={false}
                disabled={importing}
              />
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!url.trim() || importing}
              >
                {importing ? "Importing…" : "Import"}
              </button>
            </div>

            <div className={styles.detailsBlock}>
              <h3 className={styles.detailsHeading}>
                Show details{" "}
                <span className={styles.optional}>(optional overrides)</span>
              </h3>
              <ShowDetailsForm
                details={details}
                onChange={updateDetail}
                disabled={importing}
                idPrefix="import"
                intro="Leave any field blank to use what YouTube provides."
              />
            </div>

            <CoverUploadField
              coverFile={coverFile}
              coverPreview={coverPreview}
              onFileChange={setCoverFile}
              disabled={importing}
              id="import-cover-upload"
            />

            {importStatus && (
              <p className={styles.status} role="status">
                {importStatus}
              </p>
            )}

            {showImportError && (
              <p className={styles.error} role="alert">
                {importError}
              </p>
            )}

            {url.trim() && !showImportError && isValidUrl && !importing && (
              <p className={styles.hint}>Looks good — hit Import to continue.</p>
            )}
          </form>
        </section>
      </main>

      {editingShow && (
        <EditShowModal
          show={editingShow}
          onClose={() => setEditingShow(null)}
          onSaved={handleShowSaved}
          onRemoved={handleShowRemoved}
        />
      )}
    </div>
  );
}
