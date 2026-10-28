import app from '../server/index.js';

/**
 * Vercel Serverless Function Entry Point (Defense-in-Depth Step 2)
 * Executes all backend API routes, MongoDB Atlas queries, and JWT verification
 * inside Vercel's secure cloud runtime so zero API keys or secrets are ever exposed in the browser.
 */
export default app;
