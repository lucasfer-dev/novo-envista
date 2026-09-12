// Vitest runs outside the Next.js compiler, which normally provides the
// `server-only` sentinel module. This empty test-only module lets server code be
// imported for unit tests without weakening the production Next.js boundary.
export {};
