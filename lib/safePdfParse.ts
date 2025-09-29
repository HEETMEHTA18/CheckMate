// Lightweight wrapper to call the internal pdf-parse implementation
// This bypasses the package entrypoint which runs a debug harness in some environments.
export default async function safePdfParse(buffer: Buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('safePdfParse expects a Buffer');
  }
  // Try to load the internal implementation to avoid side-effectful package entrypoint
  try {
    // Prefer the internal module path which doesn't run the package test harness
    const internal = await import('pdf-parse/lib/pdf-parse.js');
    const impl: any = (internal as any).default || internal;
    return impl(buffer);
  } catch (err) {
    // Fallback to the regular package import
    const pkg = await import('pdf-parse');
    const impl: any = (pkg as any).default || pkg;
    return impl(buffer);
  }
}
