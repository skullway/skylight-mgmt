// Phase 1 replaces this with a next-auth (Google + ADMIN_EMAILS allowlist) session check.
// Until then every admin endpoint is locked.
export async function isAdmin(): Promise<boolean> {
  return false;
}
