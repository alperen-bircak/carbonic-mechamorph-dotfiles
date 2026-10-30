// The page's link to the disk, because Firefox has no file system API. Runs
// inside Vite for both `just dev` and `just app`. Saves only go to this repo's
// schemes/base24 folder; requests from other sites are refused.
import { readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { Connect, Plugin } from "vite";
import { parseScheme, type Scheme } from "../src/lib/scheme";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_BODY = 256 * 1024;

const dataDir = join(process.env.XDG_DATA_HOME || join(homedir(), ".local/share"), "tinted-theming/tinty");

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
};

// Only this machine, and for writes only this page: a site open in another tab
// can't send a JSON POST here without a preflight, which nothing answers.
function trusted(req: IncomingMessage): boolean {
  const host = req.headers.host ?? "";
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return false;
  if (req.method === "GET") return true;
  const origin = req.headers.origin;
  if (origin) {
    try { if (new URL(origin).host !== host) return false; } catch { return false; }
  }
  return (req.headers["content-type"] ?? "").startsWith("application/json");
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("too large");
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function scanDir(dir: string, system: string) {
  const names = await readdir(dir).catch(() => [] as string[]);
  const found = await Promise.all(names.filter((n) => n.endsWith(".yaml")).map(async (n) => {
    const slug = n.slice(0, -".yaml".length);
    const scheme = parseScheme(await readFile(join(dir, n), "utf8").catch(() => ""));
    return scheme && { id: `${system}-${slug}`, slug, system, ...scheme };
  }));
  return found.filter((f): f is { id: string; slug: string; system: string } & Scheme => !!f)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function schemeApi(): Plugin {
  let mine = "";
  let library: ReturnType<typeof loadLibrary> | null = null;

  const loadLibrary = async () => {
    const root = join(dataDir, "scheme-repos/schemes");
    const [b24, b16] = await Promise.all([scanDir(join(root, "base24"), "base24"), scanDir(join(root, "base16"), "base16")]);
    return [...b24, ...b16];
  };

  const handle = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
    const route = `${req.method} ${url.pathname}`;

    if (route === "GET /api/schemes") {
      const current = (await readFile(join(dataDir, "current_scheme"), "utf8").catch(() => "")).trim();
      return send(res, 200, { schemes: await scanDir(mine, "base24"), current });
    }

    if (route === "GET /api/library") {
      library ??= loadLibrary();
      return send(res, 200, await library);
    }

    if (route === "GET /api/scheme") {
      const slug = url.searchParams.get("slug") ?? "";
      if (!SLUG.test(slug)) return send(res, 400, { error: "Bad scheme name" });
      const file = join(mine, `${slug}.yaml`);
      try {
        const [text, info] = await Promise.all([readFile(file, "utf8"), stat(file)]);
        return send(res, 200, { slug, text, mtime: info.mtimeMs });
      } catch {
        return send(res, 404, { error: `${slug}.yaml doesn't exist` });
      }
    }

    if (route === "PUT /api/scheme") {
      const { slug, text, expectedMtime, overwrite } = await readBody(req);
      if (typeof slug !== "string" || !SLUG.test(slug)) return send(res, 400, { error: "Bad scheme name" });
      const parsed = typeof text === "string" ? parseScheme(text) : null;
      if (!parsed || typeof text !== "string") return send(res, 400, { error: "Not a valid scheme" });
      const file = join(mine, `${slug}.yaml`);
      const existing = await stat(file).catch(() => null);
      // Something else changed the file since it was opened
      if (existing && !overwrite && existing.mtimeMs !== expectedMtime) {
        return send(res, 409, { error: `${slug}.yaml changed on disk`, conflict: true });
      }
      // Written beside the target, then swapped in, so a crash can't leave half a file
      const tmp = join(mine, `.${slug}.${process.pid}.tmp`);
      try {
        await writeFile(tmp, text);
        await rename(tmp, file);
      } catch (e) {
        await unlink(tmp).catch(() => {});
        throw e;
      }
      return send(res, 200, { slug, mtime: (await stat(file)).mtimeMs });
    }

    send(res, 404, { error: "Not found" });
  };

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (!url.pathname.startsWith("/api/")) return next();
    if (!trusted(req)) return send(res, 403, { error: "Forbidden" });
    handle(req, res, url).catch((e) => send(res, 500, { error: String(e?.message ?? e) }));
  };

  return {
    name: "scheme-api",
    configResolved(config) {
      mine = resolve(config.root, "../../tinty/.config/tinted-theming/tinty/schemes/base24");
    },
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}
