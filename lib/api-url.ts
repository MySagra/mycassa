/**
 * API URL Resolution Utility
 * 
 * Handles the "dual identity" problem in Docker:
 * - Server-side (Server Actions, API Routes, NextAuth): uses API_URL (internal Docker network, e.g. http://backend:3000)
 * - Client-side (Browser): uses NEXT_PUBLIC_API_URL (public URL, e.g. https://api.mysagra.com)
 * 
 * This avoids SSL certificate issues and unnecessary network hops when making
 * server-to-server calls inside Docker.
 */

/**
 * Returns the correct API base URL based on execution context.
 * 
 * - On the server (Node.js): returns API_URL (internal Docker network)
 * - On the client (browser): returns NEXT_PUBLIC_API_URL (public URL)
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use internal Docker network URL
    return process.env.API_URL || 'http://localhost:4300';
  }
  // Client-side: use public URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4300';
}

/**
 * Returns the server-side API URL only.
 * Use this in files marked with 'use server' where you're certain
 * the code runs only on the server.
 */
export function getServerApiUrl(): string {
  return process.env.API_URL || 'http://localhost:4300';
}
