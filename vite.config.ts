import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync, readdirSync } from "fs";

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "./package.json"), "utf-8"));

const LESSONS_DIR = path.resolve(__dirname, "./src/content/lessons");
const VIRTUAL_ID = "virtual:lesson-index";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

/**
 * Builds the lesson CATALOGUE (titles, series, free/premium, reading time) at
 * build time, without the lesson bodies.
 *
 * Why this exists: the library page, the home page and the dashboard all need
 * every lesson's metadata, but only the reader needs the prose. Globbing the
 * markdown eagerly from application code meant Vite inlined every full lesson
 * into the first JavaScript download — half a megabyte today, and growing with
 * every lesson written. Splitting the catalogue from the bodies means a visitor
 * downloads one lesson's text when they open one lesson.
 *
 * Adding a lesson is still just dropping an `S<series>M<module>.md` file into
 * src/content/lessons/ — this reads whatever is there. See CONTENT-README.md.
 */
function lessonIndexPlugin(): Plugin {
  return {
    name: "orchestra-core:lesson-index",

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;
      return `export default ${JSON.stringify(buildIndex(), null, 2)};`;
    },

    // Dev server: adding or editing a lesson file should refresh the catalogue
    // without a manual restart.
    configureServer(server) {
      server.watcher.add(LESSONS_DIR);
      const invalidate = (file: string) => {
        if (!file.startsWith(LESSONS_DIR)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", invalidate);
      server.watcher.on("unlink", invalidate);
      server.watcher.on("change", invalidate);
    },
  };
}

type FieldValue = string | number | boolean;

function parseFrontmatter(raw: string): Record<string, FieldValue> | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const data: Record<string, FieldValue> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (!key || key.startsWith("#")) continue;

    const val = line.slice(idx + 1).trim();
    const quote = val[0];
    if ((quote === '"' || quote === "'") && val.endsWith(quote)) {
      data[key] = val.slice(1, -1);
    } else if (val === "true" || val === "false") {
      data[key] = val === "true";
    } else if (val !== "" && !Number.isNaN(Number(val))) {
      data[key] = Number(val);
    } else {
      data[key] = val;
    }
  }
  return data;
}

function buildIndex() {
  let files: string[];
  try {
    files = readdirSync(LESSONS_DIR).filter(f => f.endsWith(".md"));
  } catch {
    return [];
  }

  const lessons = [];
  for (const file of files) {
    const raw = readFileSync(path.join(LESSONS_DIR, file), "utf-8");
    const d = parseFrontmatter(raw);

    if (!d) {
      console.warn(`[lessons] ${file}: missing or malformed frontmatter — skipped.`);
      continue;
    }
    if (typeof d.series !== "number" || typeof d.module !== "number") {
      console.warn(`[lessons] ${file}: 'series' and 'module' must be plain numbers — skipped.`);
      continue;
    }
    if (!d.title || !d.seriesTitle) {
      console.warn(`[lessons] ${file}: 'title' and 'seriesTitle' are required — skipped.`);
      continue;
    }

    lessons.push({
      code: `S${d.series}M${d.module}`,
      series: d.series,
      module: d.module,
      seriesTitle: String(d.seriesTitle),
      title: String(d.title),
      free: d.free === true,
      estMinutes: typeof d.estMinutes === "number" ? d.estMinutes : 0,
      summary: d.summary !== undefined ? String(d.summary) : "",
    });
  }

  // Never rely on filesystem order — always sort by series, then module.
  lessons.sort((a, b) => a.series - b.series || a.module - b.module);
  return lessons;
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), lessonIndexPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
}));
