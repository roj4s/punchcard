// Only same-site paths, so ?next= can't send people to another site
export function safePath(next: string | null | undefined, fallback = "/cards") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
