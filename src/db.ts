import * as SQLite from 'expo-sqlite';
import type { Bookmark } from './types';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('links.db');
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      summary TEXT,
      favicon_url TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmark_id TEXT NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (bookmark_id, tag_id)
    );
  `);
  // Idempotent migrations — ALTER TABLE is a no-op if the column already exists.
  try {
    await _db.execAsync('ALTER TABLE bookmarks ADD COLUMN image_url TEXT');
  } catch {
    // Column already exists — ignore.
  }
  try {
    await _db.execAsync(
      "ALTER TABLE bookmarks ADD COLUMN user_id TEXT NOT NULL DEFAULT 'guest'",
    );
  } catch {
    // Column already exists — ignore.
  }
  return _db;
}

type BookmarkRow = {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  favicon_url: string;
  image_url: string | null;
  created_at: number;
  user_id: string;
};

function randomUuid(): string {
  // RFC4122 v4 using Math.random — sufficient for local ids.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function computeFaviconUrl(url: string): string {
  try {
    const host = new URL(url).host;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return '';
  }
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export async function createBookmark(
  url: string,
  tags: string[] = [],
  userId: string = 'guest',
): Promise<Bookmark> {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL: must be http or https');
  }
  const now = Date.now();
  const bookmark: Bookmark = {
    id: randomUuid(),
    url,
    title: null,
    summary: null,
    faviconUrl: computeFaviconUrl(url),
    imageUrl: null,
    createdAt: now,
    tags: Array.from(new Set(tags.map(normalizeTag).filter(Boolean))),
  };
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO bookmarks (id, url, title, summary, favicon_url, image_url, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      bookmark.id,
      bookmark.url,
      bookmark.title,
      bookmark.summary,
      bookmark.faviconUrl,
      bookmark.imageUrl,
      bookmark.createdAt,
      userId,
    );
    await insertTagLinks(db, bookmark.id, bookmark.tags);
  });
  return bookmark;
}

async function insertTagLinks(
  db: SQLite.SQLiteDatabase,
  bookmarkId: string,
  tagNames: string[],
): Promise<void> {
  for (const name of tagNames) {
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM tags WHERE name = ?',
      name,
    );
    let tagId: string;
    if (existing) {
      tagId = existing.id;
    } else {
      tagId = randomUuid();
      await db.runAsync('INSERT INTO tags (id, name) VALUES (?, ?)', tagId, name);
    }
    await db.runAsync(
      'INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
      bookmarkId,
      tagId,
    );
  }
}

async function cleanupOrphanTags(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(
    'DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM bookmark_tags)',
  );
}

export async function listBookmarks(userId: string = 'guest'): Promise<Bookmark[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<BookmarkRow>(
    'SELECT id, url, title, summary, favicon_url, image_url, created_at, user_id FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC',
    userId,
  );
  const bookmarks: Bookmark[] = [];
  for (const row of rows) {
    const tags = await db.getAllAsync<{ name: string }>(
      `SELECT t.name FROM tags t
       JOIN bookmark_tags bt ON bt.tag_id = t.id
       WHERE bt.bookmark_id = ?
       ORDER BY t.name ASC`,
      row.id,
    );
    bookmarks.push({
      id: row.id,
      url: row.url,
      title: row.title,
      summary: row.summary,
      faviconUrl: row.favicon_url,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      tags: tags.map((t) => t.name),
    });
  }
  return bookmarks;
}

export async function updateBookmark(bookmark: Bookmark): Promise<void> {
  if (!isValidUrl(bookmark.url)) {
    throw new Error('Invalid URL');
  }
  const normalizedTags = Array.from(
    new Set(bookmark.tags.map(normalizeTag).filter(Boolean)),
  );
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE bookmarks SET url = ?, title = ?, summary = ?, favicon_url = ?, image_url = ? WHERE id = ?',
      bookmark.url,
      bookmark.title,
      bookmark.summary,
      computeFaviconUrl(bookmark.url),
      bookmark.imageUrl,
      bookmark.id,
    );
    await db.runAsync('DELETE FROM bookmark_tags WHERE bookmark_id = ?', bookmark.id);
    await insertTagLinks(db, bookmark.id, normalizedTags);
    await cleanupOrphanTags(db);
  });
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM bookmarks WHERE id = ?', id);
    await cleanupOrphanTags(db);
  });
}

export async function listAllTags(userId: string = 'guest'): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT DISTINCT t.name FROM tags t
     JOIN bookmark_tags bt ON bt.tag_id = t.id
     JOIN bookmarks b ON b.id = bt.bookmark_id
     WHERE b.user_id = ?
     ORDER BY t.name ASC`,
    userId,
  );
  return rows.map((r) => r.name);
}
