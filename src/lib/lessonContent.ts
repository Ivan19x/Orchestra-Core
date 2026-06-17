// Every lesson .md file is loaded as a raw string at build time and the
// frontmatter block is stripped here so the reader gets just the markdown
// body. Deliberately avoids gray-matter — it pulls in a Node "Buffer"
// reference that doesn't exist in the Electron renderer (nodeIntegration is
// off), which crashed the whole app shell when used here.
const files = import.meta.glob('/content/lessons/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  let body = (match ? raw.slice(match[0].length) : raw).trim();
  // Drop the leading "# Title" line — the reader already renders the
  // lesson title from lessons.ts, so keeping it would show it twice.
  body = body.replace(/^#\s+.+\r?\n+/, '');
  return body.trim();
}

export interface LessonContent {
  body: string;
}

const byPath = new Map<string, LessonContent>();

for (const [filePath, raw] of Object.entries(files)) {
  if (filePath.endsWith('/README.md')) continue;
  const key = filePath.replace(/^\/content\/lessons\//, '').replace(/\.md$/, '');
  byPath.set(key, { body: stripFrontmatter(raw) });
}

// lessons.ts slugs are bare (e.g. "1-1-what-money-actually-is") for series-1
// lessons but folder-prefixed (e.g. "smart-money/01-...") for other series.
export function getLessonContent(slug: string): LessonContent | undefined {
  return byPath.get(slug) ?? byPath.get(`series-1/${slug}`);
}
