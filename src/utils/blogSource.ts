import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import {
  DOC_MIME,
  FOLDER_MIME,
  driveConfigured,
  listFolder,
  readBytes,
  readText,
  rootFolderId,
  type DriveFile,
} from './googleDrive';

/**
 * Where blog posts come from: a Google Drive folder when it is configured,
 * otherwise src/content/blog in the repo (local development, and a fallback).
 * Both have the same shape, one folder per post:
 *
 *   Blog/
 *     Berlin to Istanbul/        folder name -> URL slug (berlin-to-istanbul)
 *       index                    Google Doc (or index.md): the post / the trip
 *       2026-09-26               a travel-log day
 *       race.jpg                 photos, referenced by file name
 *
 * Text is a Google Doc (exported as Markdown) or a .md/.txt file; either way
 * the name without its extension is what counts ("index", "2026-09-26").
 */

const LOCAL_DIR = path.join(process.cwd(), 'src/content/blog');

export type PostFolder = { slug: string; name: string; ref: string };

export type PostFile = {
  /** Name as stored, e.g. "race.jpg" or "2026-09-26". */
  name: string;
  /** Name without a .md/.txt extension: "index", "2026-09-26". */
  base: string;
  kind: 'text' | 'media';
  mime: string;
  ref: DriveFile | string;
};

export const MEDIA_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

const TEXT_EXT = /\.(md|markdown|txt)$/i;

export function slugify(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const usingDrive = driveConfigured;

/** Every post folder. Cached per request, so one render lists Drive once. */
export const listPostFolders = cache(async (): Promise<PostFolder[]> => {
  if (driveConfigured()) {
    return (await listFolder(rootFolderId()))
      .filter((f) => f.mimeType === FOLDER_MIME && slugify(f.name))
      .map((f) => ({ slug: slugify(f.name), name: f.name, ref: f.id }));
  }
  if (!fs.existsSync(LOCAL_DIR)) return [];
  return fs
    .readdirSync(LOCAL_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && slugify(e.name))
    .map((e) => ({ slug: slugify(e.name), name: e.name, ref: path.join(LOCAL_DIR, e.name) }));
});

export async function findPostFolder(slug: string) {
  return (await listPostFolders()).find((f) => f.slug === slug) ?? null;
}

/** The text and media files in one post folder; anything else is ignored. */
export const listPostFiles = cache(async (folder: PostFolder): Promise<PostFile[]> => {
  if (driveConfigured()) {
    const files: PostFile[] = [];
    for (const f of await listFolder(folder.ref)) {
      const ext = path.extname(f.name).toLowerCase();
      if (f.mimeType === DOC_MIME || TEXT_EXT.test(f.name) || f.mimeType === 'text/markdown') {
        files.push({ name: f.name, base: f.name.replace(TEXT_EXT, '').trim(), kind: 'text', mime: f.mimeType, ref: f });
      } else if (f.mimeType.startsWith('image/') || f.mimeType === 'video/mp4') {
        files.push({ name: f.name, base: f.name, kind: 'media', mime: MEDIA_TYPES[ext] ?? f.mimeType, ref: f });
      }
    }
    // Opening a .md file with Google Docs leaves both behind under one name;
    // the Doc is the one being edited.
    return files.filter(
      (f) =>
        f.kind === 'media' ||
        f.mime === DOC_MIME ||
        !files.some((g) => g !== f && g.kind === 'text' && g.base === f.base && g.mime === DOC_MIME)
    );
  }
  return fs.readdirSync(folder.ref).flatMap((name): PostFile[] => {
    const ext = path.extname(name).toLowerCase();
    const full = path.join(folder.ref, name);
    if (TEXT_EXT.test(name)) return [{ name, base: name.replace(TEXT_EXT, ''), kind: 'text', mime: 'text/markdown', ref: full }];
    if (MEDIA_TYPES[ext]) return [{ name, base: name, kind: 'media', mime: MEDIA_TYPES[ext], ref: full }];
    return [];
  });
});

export async function readPostText(file: PostFile) {
  return typeof file.ref === 'string' ? fs.readFileSync(file.ref, 'utf8') : readText(file.ref);
}

export async function readPostBytes(file: PostFile) {
  return typeof file.ref === 'string' ? fs.readFileSync(file.ref) : readBytes(file.ref);
}
