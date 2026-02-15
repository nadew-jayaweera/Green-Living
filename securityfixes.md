# Security Audit 

This document outlines identified security vulnerabilities, potential risks, and recommended improvements for the Green Living application.

---

## 1. 🚨 Critical Privacy Leak: Unauthorized Content Access
*   **Location**: `/api/uploads`
*   **Issue**: Any authenticated user can view the private (`PENDING` or `REJECTED`) uploads of any other user by passing a `userId` query parameter.
*   **Risk**: Unauthorized access to private user data.
*   **Recommended Fix**: Update `GET` handlers to verify the session user's ID against the requested `userId`. Only admins or the owner should see non-approved posts.

## 2. 🛡️ XSS Prevention: Input Sanitization
*   **Location**: Forum Posts, Comments, Upload Descriptions, Locations.
*   **Issue**: User-generated text is saved and rendered without sanitization.
*   **Risk**: **Cross-Site Scripting (XSS)** attacks via malicious `<script>` tags.
*   **Recommended Fix**: Use `isomorphic-dompurify` to sanitize all text inputs on the server before database insertion.

## 3. 🔐 Authentication: Brute-Force & Rate Limiting
*   **Location**: Login, Registration, and Upload Endpoints.
*   **Issue**: No limits on repeated requests.
*   **Risk**: Attackers can brute-force passwords or spam storage (Denial of Wallet).
*   **Recommended Fix**: Implement rate-limiting middleware (e.g., `upstash/ratelimit` or `express-rate-limit` patterns) to cap attempts per IP.

## 4. 📂 File Integrity: restricted Uploads
*   **Location**: `uploadImage` utility and Upload API.
*   **Issue**: Server trusts the client-provided MIME type header.
*   **Risk**: Malicious executables masked as images.
*   **Recommended Fix**: Validate the file's "magic numbers" (binary signature) using a library like `file-type` before processing buffers.

## 5. ⚠️ Information Disclosure
*   **Location**: General API error handling.
*   **Issue**: Error stacks or Prisma/Cloudinary error messages are returned to the client.
*   **Risk**: Leaking database schema or internal logic.
*   **Recommended Fix**: Return generic user-facing messages; log detailed errors only to private server logs.

## 6. 🏗️ Secure HTTP Headers
*   **Location**: Global Application.
*   **Issue**: Missing CSP, HSTS, and X-Frame-Options.
*   **Risk**: Clickjacking and cross-site injections.
*   **Recommended Fix**: Add a Next.js `middleware.ts` to inject standard security headers:
    - `Content-Security-Policy`
    - `Strict-Transport-Security`
    - `X-Frame-Options: DENY`

## 7. 🔑 JWT Session Expiry
*   **Location**: `src/lib/auth.ts`
*   **Issue**: Role changes in the database don't take effect until current JWTs expire.
*   **Risk**: A demoted admin could retain access for the remainder of their session.
*   **Recommended Fix**: Perform a quick DB role-lookup inside the `requireAdmin` helper instead of relying solely on the token payload.

## 8. 🛡️ Strong Password Policy
*   **Location**: `/api/auth/register`
*   **Issue**: Complexity is not enforced (minimum 6 characters only).
*   **Risk**: Guessable user accounts.
*   **Recommended Fix**: Use `zod` to require mixed-case letters, numbers, and symbols.

---

## 📈 Implementation Priority
1. **P0 (Critical)**: Privacy Leak in `/api/uploads`
2. **P1 (High)**: XSS Sanitization & Rate Limiting
3. **P2 (Medium)**: Secure Headers & File Type Validation
