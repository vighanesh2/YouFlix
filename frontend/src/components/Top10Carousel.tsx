import { useRef } from "react";
import { Link } from "react-router-dom";
import type { Playlist } from "../api/client";
import { useCarouselActivation } from "../hooks/useCarouselActivation";
import { getPlaylistCover } from "../utils/playlistCover";
import {
  formatShowMeta,
  getShowDescription,
  getShowSeriesLabel,
  getShowTitle,
} from "../utils/showMetadata";
import LazyPoster from "./LazyPoster";
import styles from "./Top10Carousel.module.css";

interface Props {
  title?: string;
  shows: Playlist[];
  limit?: number;
}

export default function Top10Carousel({
  title = "Top 10",
  shows,
  limit = 10,
}: Props) {
  const ranked = shows.slice(0, limit);
  const rowRef = useRef<HTMLDivElement>(null);
  const { activeIndex, activateIndex, scheduleActivate, clearHoverTimer } =
    useCarouselActivation(rowRef);

  const activeShow = ranked[activeIndex] ?? ranked[0];
  const description = activeShow ? getShowDescription(activeShow) : "";

  if (ranked.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>

      <div className={styles.carousel}>
        <div
          className={styles.row}
          ref={rowRef}
          onMouseLeave={clearHoverTimer}
        >
          {ranked.map((show, index) => {
            const isActive = index === activeIndex;
            const cover = getPlaylistCover(show);
            const showTitle = getShowTitle(show);
            const seriesLabel = getShowSeriesLabel(show).toUpperCase();

            return (
              <Link
                key={show.id}
                to={`/show/${show.id}`}
                className={`${styles.card} ${isActive ? styles.cardActive : ""}`}
                onMouseEnter={() => scheduleActivate(index)}
                onFocus={() => activateIndex(index)}
                aria-current={isActive ? "true" : undefined}
                aria-label={`${index + 1}. ${showTitle}`}
              >
                <span className={styles.rank} aria-hidden>
                  {index + 1}
                </span>
                <div className={styles.posterWrap}>
                  {cover ? (
                    <LazyPoster
                      src={cover}
                      alt={showTitle}
                      className={styles.posterFrame}
                      imgClassName={styles.posterImg}
                      priority={index === 0}
                    />
                  ) : (
                    <div className={styles.posterPlaceholder} />
                  )}
                  {isActive && (
                    <div className={styles.posterOverlay}>
                      <span className={styles.badge}>
                        #{index + 1} · {seriesLabel}
                      </span>
                      <h3 className={styles.posterTitle}>{showTitle}</h3>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {activeShow && (
          <div className={styles.detailPanel} key={activeShow.id}>
            <p className={styles.metaLine}>{formatShowMeta(activeShow)}</p>
            {description ? (
              <p className={styles.description}>{description}</p>
            ) : (
              <p className={styles.descriptionMuted}>
                No description yet. Add one when importing this playlist.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
