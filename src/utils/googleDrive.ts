import crypto from 'crypto';

/**
 * Just enough of the Google Drive API to read the blog folder: a service
 * account token, listing a folder, exporting a Google Doc as Markdown and
 * downloading a file. Written against the REST API directly rather than
 * pulling in the googleapis package for three calls.
 *
 * Configuration (Vercel project settings, or .env.local):
 *   BLOG_DRIVE_FOLDER_ID          the "Blog" folder's id, from its URL
 * and one way in:
 *   GOOGLE_API_KEY                an API key, for a folder shared as "Anyone
 *                                 with the link: Viewer" (simplest; the
 *                                 folder is then readable by anyone who has
 *                                 its link)
 *   GOOGLE_SERVICE_ACCOUNT_KEY    or a service account's JSON key (as is or
 *                                 base64), for a folder shared only with that
 *                                 account's email (private)
 * The service account wins if both are set. Setup: docs/writing-a-post.md.
 */

const API = 'https://www.googleapis.com/drive/v3';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

export const FOLDER_MIME = 'application/vnd.google-apps.folder';
export const DOC_MIME = 'application/vnd.google-apps.document';

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
};

type ServiceAccount = { client_email: string; private_key: string };

export function driveConfigured() {
  return Boolean(
    process.env.BLOG_DRIVE_FOLDER_ID && (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_API_KEY)
  );
}

export function rootFolderId() {
  return process.env.BLOG_DRIVE_FOLDER_ID!;
}

function serviceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.trim();
  const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const key = JSON.parse(json) as ServiceAccount;
  // Keys pasted into an env var often arrive with literal "\n" sequences.
  return { ...key, private_key: key.private_key.replace(/\\n/g, '\n') };
}

let cached: { token: string; expires: number } | null = null;

/** An OAuth access token for the service account, reused until shortly before it expires. */
async function accessToken() {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;

  const { client_email, private_key } = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const encode = (part: object) => Buffer.from(JSON.stringify(part)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: client_email,
    scope: SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(private_key, 'base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`Google auth failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, expires: Date.now() + body.expires_in * 1000 };
  return cached.token;
}

async function get(url: string) {
  let res: Response;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    res = await fetch(url, { headers: { Authorization: `Bearer ${await accessToken()}` } });
  } else {
    // Link-shared folder: the key identifies the app; the sharing grants access.
    const withKey = new URL(url);
    withKey.searchParams.set('key', process.env.GOOGLE_API_KEY!);
    res = await fetch(withKey);
  }
  // The URL without the key, so it never ends up in logs.
  if (!res.ok) throw new Error(`Drive request failed: ${res.status} ${url}`);
  return res;
}

/*
 * In-process caches, so a page doesn't make the same Drive round trips on
 * every render. That matters most in `next dev`, which re-renders every
 * request (about 2 s per blog page without these); in production pages are
 * already served from the ISR cache and these only speed up revalidation.
 *
 *  - Folder listings: kept LISTING_TTL_MS. They are how an edit is noticed:
 *    each file's modifiedTime comes from the listing.
 *  - File contents: keyed by id + modifiedTime, so an edited Doc is always
 *    refetched and an unchanged one never is. No expiry needed.
 */
const LISTING_TTL_MS = 15_000;
const MAX_CACHED_FILES = 60;

const listings = new Map<string, { at: number; files: Promise<DriveFile[]> }>();
const contents = new Map<string, Promise<string | Buffer>>();

/** Remember a file's contents, dropping the oldest once the cache is full. */
function remember<T extends string | Buffer>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = contents.get(key);
  if (hit) return hit as Promise<T>;
  const pending = load().catch((error) => {
    contents.delete(key); // don't cache a failure
    throw error;
  });
  contents.set(key, pending);
  if (contents.size > MAX_CACHED_FILES) contents.delete(contents.keys().next().value!);
  return pending;
}

/** Everything directly inside a folder, not in the bin (cached briefly; see above). */
export function listFolder(folderId: string): Promise<DriveFile[]> {
  const hit = listings.get(folderId);
  if (hit && Date.now() - hit.at < LISTING_TTL_MS) return hit.files;
  const files = fetchFolder(folderId).catch((error) => {
    listings.delete(folderId);
    throw error;
  });
  listings.set(folderId, { at: Date.now(), files });
  return files;
}

async function fetchFolder(folderId: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      pageSize: '1000',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      ...(pageToken ? { pageToken } : {}),
    });
    const body = (await (await get(`${API}/files?${params}`)).json()) as {
      files: DriveFile[];
      nextPageToken?: string;
    };
    files.push(...body.files);
    pageToken = body.nextPageToken ?? '';
  } while (pageToken);
  return files;
}

/** A Google Doc as Markdown, or a plain text/Markdown file's contents. */
export function readText(file: DriveFile): Promise<string> {
  const url =
    file.mimeType === DOC_MIME
      ? `${API}/files/${file.id}/export?mimeType=text%2Fmarkdown`
      : `${API}/files/${file.id}?alt=media&supportsAllDrives=true`;
  return remember(`text:${file.id}:${file.modifiedTime}`, async () => (await get(url)).text());
}

/** A file's bytes. */
export function readBytes(file: DriveFile): Promise<Buffer> {
  return remember(`bytes:${file.id}:${file.modifiedTime}`, async () => {
    const res = await get(`${API}/files/${file.id}?alt=media&supportsAllDrives=true`);
    return Buffer.from(await res.arrayBuffer());
  });
}
