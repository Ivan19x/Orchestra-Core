// File-driven lesson catalogue.
//
// Every lesson is a single Markdown file in src/content/lessons/ named
// S<series>M<module>.md (e.g. S1M1.md) with YAML-ish frontmatter on top. There
// is NO array to register and no code to touch: drop a file in, commit, and it
// appears — series sort by number, modules by number, free/locked from the
// `free` field. See CONTENT-README.md.
//
// Two halves, deliberately:
//   • The CATALOGUE (titles, reading times, free/premium) is built at build
//     time by the `virtual:lesson-index` plugin in vite.config.ts. It's small,
//     every page needs it, so it ships in the main bundle.
//   • The BODIES are fetched one at a time by `loadLessonBody`. Bundling all of
//     them eagerly used to put ~500KB of prose into the first page load, which
//     only got worse with each lesson written.

import {
  BookOpen, Briefcase, BarChart3, Landmark, Rocket, Brain, Home, TrendingUp,
  Heart, type LucideIcon,
} from 'lucide-react';
import LESSON_INDEX from 'virtual:lesson-index';

export interface LessonMeta {
  code: string;        // "S1M1"
  series: number;
  module: number;
  seriesTitle: string;
  title: string;
  free: boolean;
  estMinutes: number;
  summary: string;
}

export interface Series {
  series: number;
  title: string;
  lessons: LessonMeta[];   // sorted by module
}

const LESSONS: LessonMeta[] = LESSON_INDEX;

// ── Catalogue ────────────────────────────────────────────────────────────────

export function getAllLessons(): LessonMeta[] {
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

export function getLesson(series: number, module: number): LessonMeta | undefined {
  return LESSONS.find(l => l.series === series && l.module === module);
}

export function getLessonByCode(code: string): LessonMeta | undefined {
  return LESSONS.find(l => l.code.toLowerCase() === code.toLowerCase());
}

export function lessonHref(l: Pick<LessonMeta, 'code'>): string {
  return `/lessons/${l.code}`;
}

// ── Bodies (loaded on demand) ────────────────────────────────────────────────

// Not eager: each lesson becomes its own chunk, fetched only when opened.
const bodyLoaders = import.meta.glob('/src/content/lessons/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

// The reader renders the title from the catalogue, so drop a leading "# Title"
// line from the body to avoid showing it twice. Also strips the frontmatter,
// which is metadata, not prose.
function stripFrontmatterAndH1(raw: string): string {
  return raw
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    .replace(/^\s*#\s+.+(\r?\n)+/, '')
    .trim();
}

export async function loadLessonBody(code: string): Promise<string | null> {
  const key = `/src/content/lessons/${code.toUpperCase()}.md`;
  const loader = bodyLoaders[key];
  if (!loader) return null;
  return stripFrontmatterAndH1(await loader());
}

// ── Optional per-series visual theming (presentation only, never lesson data) ─
// Unmapped series fall back to BookOpen — nothing breaks without an entry.
const SERIES_ICONS: Record<number, LucideIcon> = {
  1: BookOpen, 2: Briefcase, 3: BarChart3, 4: Landmark,
  5: Rocket, 6: Brain, 7: Home, 8: TrendingUp, 9: Heart,
};

export function seriesIcon(series: number): LucideIcon {
  return SERIES_ICONS[series] ?? BookOpen;
}
