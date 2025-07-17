function ensureEnv(vars: string[]) {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
}

export function initEnv() {
  ensureEnv(["JWT_SECRET", "DATABASE_URL"]);
  process.env.PORT = process.env.PORT || "3000";
}
