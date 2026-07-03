-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "thumbnailHigh" TEXT NOT NULL DEFAULT '',
    "channelId" TEXT NOT NULL DEFAULT '',
    "channelTitle" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "duration" TEXT,
    "viewCount" BIGINT,
    "likeCount" BIGINT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "embedUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "channelId" TEXT NOT NULL DEFAULT '',
    "channelTitle" TEXT NOT NULL DEFAULT '',
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistVideo" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaylistVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'RUNNING',
    "itemsSynced" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Video_title_idx" ON "Video"("title");

-- CreateIndex
CREATE INDEX "Video_publishedAt_idx" ON "Video"("publishedAt");

-- CreateIndex
CREATE INDEX "Playlist_title_idx" ON "Playlist"("title");

-- CreateIndex
CREATE INDEX "PlaylistVideo_playlistId_position_idx" ON "PlaylistVideo"("playlistId", "position");

-- CreateIndex
CREATE INDEX "PlaylistVideo_videoId_idx" ON "PlaylistVideo"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistVideo_playlistId_videoId_key" ON "PlaylistVideo"("playlistId", "videoId");

-- CreateIndex
CREATE INDEX "SyncRun_playlistId_startedAt_idx" ON "SyncRun"("playlistId", "startedAt");

-- AddForeignKey
ALTER TABLE "PlaylistVideo" ADD CONSTRAINT "PlaylistVideo_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistVideo" ADD CONSTRAINT "PlaylistVideo_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
