import { google, youtube_v3 } from "googleapis";
import { config } from "../config/env.js";
import type { Category, Video, VideoListResponse } from "../types/video.js";

const youtube = google.youtube("v3");

function getClient(): youtube_v3.Youtube {
  return youtube;
}

function mapSnippetToVideo(
  item: youtube_v3.Schema$SearchResult | youtube_v3.Schema$Video,
  contentDetails?: youtube_v3.Schema$VideoContentDetails,
  statistics?: youtube_v3.Schema$VideoStatistics
): Video | null {
  const rawId = item.id;
  const id =
    typeof rawId === "object" && rawId !== null
      ? rawId.videoId
      : typeof rawId === "string"
        ? rawId
        : undefined;

  const snippet = item.snippet;
  if (!id || !snippet) return null;

  const thumbnails = snippet.thumbnails;

  return {
    id,
    title: snippet.title ?? "",
    description: snippet.description ?? "",
    thumbnail: thumbnails?.medium?.url ?? thumbnails?.default?.url ?? "",
    thumbnailHigh: thumbnails?.high?.url ?? thumbnails?.medium?.url ?? "",
    channelId: snippet.channelId ?? "",
    channelTitle: snippet.channelTitle ?? "",
    publishedAt: snippet.publishedAt ?? "",
    duration: contentDetails?.duration ?? undefined,
    viewCount: statistics?.viewCount ?? undefined,
    likeCount: statistics?.likeCount ?? undefined,
    tags: "tags" in snippet ? snippet.tags ?? undefined : undefined,
  };
}

async function enrichVideos(
  videoIds: string[]
): Promise<Map<string, { contentDetails?: youtube_v3.Schema$VideoContentDetails; statistics?: youtube_v3.Schema$VideoStatistics; tags?: string[] }>> {
  if (videoIds.length === 0) return new Map();

  const response = await getClient().videos.list({
    key: config.youtubeApiKey,
    part: ["contentDetails", "statistics", "snippet"],
    id: videoIds,
  });

  const map = new Map<
    string,
    { contentDetails?: youtube_v3.Schema$VideoContentDetails; statistics?: youtube_v3.Schema$VideoStatistics; tags?: string[] }
  >();

  for (const item of response.data.items ?? []) {
    if (item.id) {
      map.set(item.id, {
        contentDetails: item.contentDetails ?? undefined,
        statistics: item.statistics ?? undefined,
        tags: item.snippet?.tags ?? undefined,
      });
    }
  }

  return map;
}

export async function searchVideos(options: {
  q?: string;
  categoryId?: string;
  channelId?: string;
  regionCode?: string;
  maxResults?: number;
  pageToken?: string;
  order?: "date" | "rating" | "relevance" | "title" | "videoCount" | "viewCount";
}): Promise<VideoListResponse> {
  const {
    q,
    categoryId,
    channelId,
    regionCode = "US",
    maxResults = 20,
    pageToken,
    order = "relevance",
  } = options;

  const response = await getClient().search.list({
    key: config.youtubeApiKey,
    part: ["snippet"],
    type: ["video"],
    q,
    videoCategoryId: categoryId,
    channelId,
    regionCode,
    maxResults: Math.min(maxResults, 50),
    pageToken,
    order,
    safeSearch: "moderate",
  });

  const items = response.data.items ?? [];
  const videoIds = items
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));

  const enrichment = await enrichVideos(videoIds);

  const videos: Video[] = [];
  for (const item of items) {
    const id = item.id?.videoId;
    if (!id) continue;
    const extra = enrichment.get(id);
    const video = mapSnippetToVideo(item, extra?.contentDetails, extra?.statistics);
    if (video) {
      if (extra?.tags) video.tags = extra.tags;
      videos.push(video);
    }
  }

  return {
    videos,
    nextPageToken: response.data.nextPageToken ?? undefined,
    prevPageToken: response.data.prevPageToken ?? undefined,
    totalResults: response.data.pageInfo?.totalResults ?? undefined,
  };
}

export async function getTrendingVideos(options: {
  regionCode?: string;
  categoryId?: string;
  maxResults?: number;
  pageToken?: string;
}): Promise<VideoListResponse> {
  const { regionCode = "US", categoryId, maxResults = 20, pageToken } = options;

  const response = await getClient().videos.list({
    key: config.youtubeApiKey,
    part: ["snippet", "contentDetails", "statistics"],
    chart: "mostPopular",
    regionCode,
    videoCategoryId: categoryId,
    maxResults: Math.min(maxResults, 50),
    pageToken,
  });

  const videos: Video[] = [];
  for (const item of response.data.items ?? []) {
    const video = mapSnippetToVideo(
      item,
      item.contentDetails ?? undefined,
      item.statistics ?? undefined
    );
    if (video) {
      video.tags = item.snippet?.tags ?? undefined;
      videos.push(video);
    }
  }

  return {
    videos,
    nextPageToken: response.data.nextPageToken ?? undefined,
    prevPageToken: response.data.prevPageToken ?? undefined,
    totalResults: response.data.pageInfo?.totalResults ?? undefined,
  };
}

export async function getVideoById(videoId: string): Promise<Video | null> {
  const response = await getClient().videos.list({
    key: config.youtubeApiKey,
    part: ["snippet", "contentDetails", "statistics"],
    id: [videoId],
  });

  const item = response.data.items?.[0];
  if (!item) return null;

  const video = mapSnippetToVideo(
    item,
    item.contentDetails ?? undefined,
    item.statistics ?? undefined
  );
  if (video) {
    video.tags = item.snippet?.tags ?? undefined;
  }
  return video;
}

export async function getCategories(regionCode = "US"): Promise<Category[]> {
  const response = await getClient().videoCategories.list({
    key: config.youtubeApiKey,
    part: ["snippet"],
    regionCode,
  });

  return (response.data.items ?? [])
    .filter((item) => item.snippet?.assignable)
    .map((item) => ({
      id: item.id ?? "",
      title: item.snippet?.title ?? "",
    }))
    .filter((cat) => cat.id && cat.title);
}

export async function getVideosByCategory(
  categoryId: string,
  options: { regionCode?: string; maxResults?: number; pageToken?: string } = {}
): Promise<VideoListResponse> {
  return searchVideos({
    categoryId,
    regionCode: options.regionCode,
    maxResults: options.maxResults,
    pageToken: options.pageToken,
    order: "viewCount",
  });
}
