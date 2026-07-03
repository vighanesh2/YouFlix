export interface ShowOverrides {
  customTitle?: string;
  customChannelTitle?: string;
  customYear?: string;
  customSeriesLabel?: string;
  customRating?: string;
  customDescription?: string;
}

export function parseShowOverrides(body: Record<string, unknown>): ShowOverrides {
  const read = (key: string): string | undefined => {
    const value = body[key];
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  };

  return {
    customTitle: read("title"),
    customChannelTitle: read("channelTitle"),
    customYear: read("year"),
    customSeriesLabel: read("seriesLabel"),
    customRating: read("rating"),
    customDescription: read("description"),
  };
}

export function pickDefinedOverrides(
  overrides: ShowOverrides
): ShowOverrides {
  const result: ShowOverrides = {};
  if (overrides.customTitle) result.customTitle = overrides.customTitle;
  if (overrides.customChannelTitle) {
    result.customChannelTitle = overrides.customChannelTitle;
  }
  if (overrides.customYear) result.customYear = overrides.customYear;
  if (overrides.customSeriesLabel) {
    result.customSeriesLabel = overrides.customSeriesLabel;
  }
  if (overrides.customRating) result.customRating = overrides.customRating;
  if (overrides.customDescription) {
    result.customDescription = overrides.customDescription;
  }
  return result;
}

const OVERRIDE_FIELD_MAP: Array<{
  formKey: string;
  customKey: keyof ShowOverrides;
}> = [
  { formKey: "title", customKey: "customTitle" },
  { formKey: "channelTitle", customKey: "customChannelTitle" },
  { formKey: "year", customKey: "customYear" },
  { formKey: "seriesLabel", customKey: "customSeriesLabel" },
  { formKey: "rating", customKey: "customRating" },
  { formKey: "description", customKey: "customDescription" },
];

export function parseShowOverridesForUpdate(
  body: Record<string, unknown>
): Partial<ShowOverrides> {
  const result: Partial<ShowOverrides> = {};

  for (const { formKey, customKey } of OVERRIDE_FIELD_MAP) {
    if (formKey in body && typeof body[formKey] === "string") {
      result[customKey] = body[formKey].trim();
    }
  }

  return result;
}
