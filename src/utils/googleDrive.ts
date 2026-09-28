import crypto from 'crypto';

/**
 * Just enough of the Google Drive API to read the blog folder: a service
 * account token, listing a folder, exporting a Google Doc as Markdown and
 * downloading a file. Written against the REST API directly rather than
 * pulling in the googleapis package for three calls.
 *
 * Configuration (Vercel project settings, or .env.local):
 *   BLOG_DRIVE_FOLDER_ID          the "Blog" folder's id, from its URL
 *   GOOGLE_SERVICE_ACCOUNT_KEY    the service account's JSON key, as is or
 *                                 base64-encoded
 * The folder must be shared with the service account's email (Viewer).
 * Setup steps: docs/writing-a-post.md.
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
  return Boolean(process.env.BLOG_DRIVE_FOLDER_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
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
  const res = await fetch(url, { headers: { Authorization: `Bearer ${await accessToken()}` } });
  if (!res.ok) throw new Error(`Drive request failed: ${res.status} ${url}`);
  return res;
}

/** Everything directly inside a folder, not in the bin. */
export async function listFolder(folderId: string): Promise<DriveFile[]> {
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
export async function readText(file: DriveFile): Promise<string> {
  const url =
    file.mimeType === DOC_MIME
      ? `${API}/files/${file.id}/export?mimeType=text%2Fmarkdown`
      : `${API}/files/${file.id}?alt=media&supportsAllDrives=true`;
  return (await get(url)).text();
}

/** A file's bytes. */
export async function readBytes(file: DriveFile): Promise<Buffer> {
  const res = await get(`${API}/files/${file.id}?alt=media&supportsAllDrives=true`);
  return Buffer.from(await res.arrayBuffer());
}
