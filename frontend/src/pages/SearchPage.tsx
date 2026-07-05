import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LazyPoster from "../components/LazyPoster";
import SearchSidebar from "../components/SearchSidebar";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { usePlaylists } from "../hooks/usePlaylists";
import { getGridCover } from "../utils/playlistCover";
import {
  buildSuggestions,
  filterShowsByQuery,
  getRecommendationShows,
} from "../utils/searchShows";
import { getShowTitle } from "../utils/showMetadata";
import styles from "./SearchPage.module.css";

const RESULTS_LIMIT = 8;
const SEARCH_DEBOUNCE_MS = 300;

export default function SearchPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { playlists, loading, error } = usePlaylists();
  const [query, setQuery] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [committedQuery, setCommittedQuery] = useState("");

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setCommittedQuery(debouncedQuery.trim());
  }, [debouncedQuery]);

  const suggestions = useMemo(
    () => buildSuggestions(playlists, query),
    [playlists, query]
  );

  useEffect(() => {
    setActiveSuggestion(0);
  }, [query, suggestions.length]);

  const resultsQuery = committedQuery;

  const matches = useMemo(() => {
    if (!resultsQuery) return [];
    return filterShowsByQuery(playlists, resultsQuery).slice(0, RESULTS_LIMIT);
  }, [playlists, resultsQuery]);

  const recommendations = useMemo(
    () =>
      getRecommendationShows(playlists, resultsQuery, matches).slice(
        0,
        RESULTS_LIMIT
      ),
    [playlists, resultsQuery, matches]
  );

  const hasExactResults = matches.length > 0;
  const displayShows = hasExactResults ? matches : recommendations;
  const showFallbackHeading =
    resultsQuery.length > 0 && !hasExactResults && recommendations.length > 0;
  const showResults = resultsQuery.length > 0;

  function commitSuggestion(suggestion: string) {
    setQuery(suggestion);
    setCommittedQuery(suggestion);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((index) =>
        index < suggestions.length - 1 ? index + 1 : index
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((index) => (index > 0 ? index - 1 : 0));
    } else if (e.key === "Enter" && suggestions[activeSuggestion]) {
      e.preventDefault();
      commitSuggestion(suggestions[activeSuggestion]);
    }
  }

  return (
    <div className={styles.page}>
      <SearchSidebar />

      <div className={styles.content}>
        <header className={styles.searchHeader}>
          <span className={styles.searchIcon} aria-hidden>
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
              />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            className={styles.searchInput}
            placeholder="Titles, channels, descriptions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search shows"
            autoComplete="off"
            spellCheck={false}
          />
        </header>

        {loading && <p className={styles.status}>Loading…</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && !error && (
          <div className={styles.body}>
            <div className={styles.suggestionsPanel}>
              {query.trim() && suggestions.length === 0 && (
                <p className={styles.noSuggestions}>No matches found</p>
              )}

              {suggestions.length > 0 && (
                <ul className={styles.suggestionList} role="listbox">
                  {suggestions.map((suggestion, index) => (
                    <li key={suggestion} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={index === activeSuggestion}
                        className={`${styles.suggestionItem} ${
                          index === activeSuggestion
                            ? styles.suggestionItemActive
                            : ""
                        }`}
                        onMouseEnter={() => setActiveSuggestion(index)}
                        onClick={() => commitSuggestion(suggestion)}
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!query.trim() && playlists.length > 0 && (
                <p className={styles.hint}>Start typing to search your library</p>
              )}

              {!query.trim() && playlists.length === 0 && (
                <p className={styles.hint}>
                  No shows yet.{" "}
                  <Link to="/import" className={styles.hintLink}>
                    Import a playlist
                  </Link>
                </p>
              )}
            </div>

            <div className={styles.resultsPanel}>
              {!showResults && (
                <p className={styles.resultsHint}>
                  Results appear here after you search
                </p>
              )}

              {showResults && showFallbackHeading && (
                <h2 className={styles.resultsHeading}>
                  We don&apos;t have &apos;{resultsQuery}&apos; but you might like:
                </h2>
              )}

              {showResults && hasExactResults && (
                <h2 className={styles.resultsHeading}>
                  {matches.length === 1 ? "1 result" : `${matches.length} results`}
                </h2>
              )}

              {showResults && displayShows.length > 0 ? (
                <div className={styles.grid}>
                  {displayShows.map((show, index) => {
                    const title = getShowTitle(show);
                    const cover = getGridCover(show);

                    return (
                      <Link
                        key={show.id}
                        to={`/show/${show.id}`}
                        className={styles.posterLink}
                      >
                        {cover ? (
                          <LazyPoster
                            src={cover}
                            alt={title}
                            className={styles.posterFrame}
                            imgClassName={styles.posterImg}
                            priority={index < 2}
                            rootMargin="40px 0px"
                          />
                        ) : (
                          <div className={styles.posterPlaceholder}>{title}</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                showResults &&
                !showFallbackHeading && (
                  <p className={styles.emptyResults}>
                    Nothing matched &apos;{resultsQuery}&apos;. Try another search.
                  </p>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
