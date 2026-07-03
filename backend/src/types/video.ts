export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnailHigh: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
  likeCount?: string;
  tags?: string[];
}

export interface VideoListResponse {
  videos: Video[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults?: number;
}

export interface Category {
  id: string;
  title: string;
}
