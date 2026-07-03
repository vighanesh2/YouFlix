import type { ImportShowDetails } from "../api/client";
import styles from "./ShowDetailsForm.module.css";

interface Props {
  details: ImportShowDetails;
  onChange: (key: keyof ImportShowDetails, value: string) => void;
  disabled?: boolean;
  idPrefix?: string;
  placeholders?: ImportShowDetails;
  intro?: string;
}

export default function ShowDetailsForm({
  details,
  onChange,
  disabled = false,
  idPrefix = "show",
  placeholders,
  intro,
}: Props) {
  return (
    <div className={styles.section}>
      {intro && <p className={styles.intro}>{intro}</p>}

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor={`${idPrefix}-title`} className={styles.label}>
            Title
          </label>
          <input
            id={`${idPrefix}-title`}
            type="text"
            className={styles.input}
            placeholder={placeholders?.title ?? "e.g. Griselda"}
            value={details.title}
            maxLength={200}
            disabled={disabled}
            onChange={(e) => onChange("title", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`${idPrefix}-channel`} className={styles.label}>
            Channel / genre
          </label>
          <input
            id={`${idPrefix}-channel`}
            type="text"
            className={styles.input}
            placeholder={placeholders?.channelTitle ?? "e.g. TV Dramas"}
            value={details.channelTitle}
            maxLength={120}
            disabled={disabled}
            onChange={(e) => onChange("channelTitle", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`${idPrefix}-year`} className={styles.label}>
            Year
          </label>
          <input
            id={`${idPrefix}-year`}
            type="text"
            className={styles.input}
            placeholder={placeholders?.year ?? "e.g. 2024"}
            value={details.year}
            maxLength={10}
            disabled={disabled}
            onChange={(e) => onChange("year", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`${idPrefix}-type`} className={styles.label}>
            Type
          </label>
          <input
            id={`${idPrefix}-type`}
            type="text"
            className={styles.input}
            placeholder={placeholders?.seriesLabel ?? "e.g. Limited Series"}
            value={details.seriesLabel}
            maxLength={60}
            disabled={disabled}
            onChange={(e) => onChange("seriesLabel", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`${idPrefix}-rating`} className={styles.label}>
            Rating
          </label>
          <input
            id={`${idPrefix}-rating`}
            type="text"
            className={styles.input}
            placeholder={placeholders?.rating ?? "e.g. TV-MA"}
            value={details.rating}
            maxLength={20}
            disabled={disabled}
            onChange={(e) => onChange("rating", e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-description`} className={styles.label}>
          Description
        </label>
        <textarea
          id={`${idPrefix}-description`}
          className={styles.textarea}
          placeholder={
            placeholders?.description ??
            "Add a synopsis if YouTube doesn't provide one…"
          }
          value={details.description}
          rows={4}
          maxLength={2000}
          disabled={disabled}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>
    </div>
  );
}
