// File-driven lesson catalogue.
//
// Every lesson is a single Markdown file in src/content/lessons/ named
// S<series>M<module>.md (e.g. S1M1.md) with YAML frontmatter on top. This
// module auto-discovers them all at build time via import.meta.glob — there is
// NO array to register, no code to touch. Drop a file in, commit, and it
// appears: series sort by number, modules by number, free/locked from the
// `free` field. See CONTENT-README.md.
//
// Frontmatter parsing uses a tiny custom splitter rather than gray-matter on
// purpose: gray-matter pulls in a Node `Buffer` reference that doesn't exist in
// the browser/Electron-renderer build and crashed the app when it was used here
// before. Our frontmatter is simple `key: value` lines, so a 20-line parser is
// both safer and lighter.

import {
  BookOpen, Briefcase, BarChart3, Landmark, Rocket, Brain, Home, TrendingUp,
  Heart, type LucideIcon,
} from 'lucide-react';

export interface Lesson {
  code: string;        // "S1M1"
  series: number;
  module: number;
  seriesTitle: string;
  title: string;
  free: boolean;
  estMinutes: number;
  summary: string;
  body: string;        // markdown body, leading "# Title" stripped
}

export interface Series {
  series: number;
  title: string;
  lessons: Lesson[];   // sorted by module
}

// ── Frontmatter parser ───────────────────────────────────────────────────────
type FieldValue = string | number | boolean;

function parseFrontmatter(raw: string): { data: Record<string, FieldValue>; body: string } | null {
  // Frontmatter must be the very first thing in the file.
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;

  const body = raw.slice(match[0].length);
  const data: Record<string, FieldValue> = {};

  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();

    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      data[key] = val.slice(1, -1);
    } else if (val === 'true' || val === 'false') {
      data[key] = val === 'true';
    } else if (val !== '' && !Number.isNaN(Number(val))) {
      data[key] = Number(val);
    } else {
      data[key] = val;
    }
  }
  return { data, body };
}

function stripLeadingH1(body: string): string {
  // The reader renders the title from frontmatter, so drop a leading "# Title"
  // line to avoid showing it twice.
  return body.replace(/^\s*#\s+.+(\r?\n)+/, '').trim();
}

// ── Auto-discovery ───────────────────────────────────────────────────────────
const files = import.meta.glob('/src/content/lessons/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function buildLessons(): Lesson[] {
  const lessons: Lesson[] = [];

  for (const [path, raw] of Object.entries(files)) {
    const parsed = parseFrontmatter(raw);
    if (!parsed) {
      console.warn(`[lessons] ${path}: missing or malformed frontmatter — skipped.`);
      continue;
    }
    const d = parsed.data;
    const missing = (['title', 'series', 'module', 'seriesTitle'] as const).filter(
      (k) => d[k] === undefined || d[k] === '',
    );
    if (missing.length) {
      console.warn(`[lessons] ${path}: missing required field(s): ${missing.join(', ')} — skipped.`);
      continue;
    }
    if (typeof d.series !== 'number' || typeof d.module !== 'number') {
      console.warn(`[lessons] ${path}: 'series' and 'module' must be plain numbers — skipped.`);
      continue;
    }

    lessons.push({
      code: `S${d.series}M${d.module}`,
      series: d.series,
      module: d.module,
      seriesTitle: String(d.seriesTitle),
      title: String(d.title),
      free: d.free === true,
      estMinutes: typeof d.estMinutes === 'number' ? d.estMinutes : 0,
      summary: d.summary !== undefined ? String(d.summary) : '',
      body: stripLeadingH1(parsed.body),
    });
  }

  // Never rely on filesystem order — always sort by series, then module.
  lessons.sort((a, b) => a.series - b.series || a.module - b.module);
  return lessons;
}

const LESSONS: Lesson[] = buildLessons();

// ── Public API ───────────────────────────────────────────────────────────────
export function getAllLessons(): Lesson[] {
  return LESSONS;
}

export function getAllSeries(): Series[] {
  const map = new Map<number, Series>();
  for (const l of LESSONS) {
    if (!map.has(l.series)) map.set(l.series, { series: l.series, title: l.seriesTitle, lessons: [] });
    map.get(l.series)!.lessons.push(l);
  }
  return [...map.values()].sort((a, b) => a.series - b.series);
}

export function getLesson(series: number, module: number): Lesson | undefined {
  return LESSONS.find((l) => l.series === series && l.module === module);
}

export function getLessonByCode(code: string): Lesson | undefined {
  return LESSONS.find((l) => l.code.toLowerCase() === code.toLowerCase());
}

export function lessonHref(l: Pick<Lesson, 'code'>): string {
  return `/lessons/${l.code}`;
}

// ── Optional per-series visual theming (presentation only, never lesson data) ──
// Lessons always come from files; this just gives each series an icon for the
// cards. Unmapped series fall back to BookOpen — nothing breaks without it.
const SERIES_ICONS: Record<number, LucideIcon> = {
  1: BookOpen, 2: Briefcase, 3: BarChart3, 4: Landmark,
  5: Rocket, 6: Brain, 7: Home, 8: TrendingUp, 9: Heart,
};

export function seriesIcon(series: number): LucideIcon {
  return SERIES_ICONS[series] ?? BookOpen;
}
