import type { Scheme } from "./scheme";

export type SchemeEntry = Scheme & { id: string; slug: string; system: string };
export type FileData = { slug: string; text: string; mtime: number };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error ?? `Request failed (${res.status})`), { conflict: !!body.conflict });
  return body as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const listSchemes = () => call<{ schemes: SchemeEntry[]; current: string }>("/api/schemes");
export const loadLibrary = () => call<SchemeEntry[]>("/api/library");
export const readScheme = (slug: string) => call<FileData>(`/api/scheme?slug=${encodeURIComponent(slug)}`);
export const writeScheme = (slug: string, text: string, expectedMtime: number | null, overwrite = false) =>
  call<{ slug: string; mtime: number }>("/api/scheme", json("PUT", { slug, text, expectedMtime, overwrite }));

export function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/yaml" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

