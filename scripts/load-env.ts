// Load .env.local / .env the same way Next.js does for local scripts.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file is optional
  }
}
