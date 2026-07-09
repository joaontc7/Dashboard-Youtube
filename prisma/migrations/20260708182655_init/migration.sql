-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "youtubeUserId" TEXT NOT NULL,
    "youtubeUsername" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "tag" TEXT NOT NULL DEFAULT 'TRIAGEM',
    "interesse" TEXT NOT NULL DEFAULT 'INDEFINIDO',
    "whatsapp" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LeadComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "videoTitle" TEXT,
    "commentId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadComment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CommentStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "youtubeCommentId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CachedVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "youtubeVideoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "duration" TEXT NOT NULL DEFAULT '0:00',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "isShort" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_youtubeUserId_key" ON "Lead"("youtubeUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadComment_commentId_key" ON "LeadComment"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentStatus_youtubeCommentId_key" ON "CommentStatus"("youtubeCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "CachedVideo_youtubeVideoId_key" ON "CachedVideo"("youtubeVideoId");
