# BinaryInsight

BinaryInsight is a GitHub-powered pull request analysis workspace built with Next.js.
It combines repository browsing, PR review workflows, comments, and security-focused change analysis in one interface.

## Highlights

- GitHub OAuth login via NextAuth
- Repository explorer with branch switching
- Pull request list with inline comments and review actions
- PR review panel with:
  - changed files + patch preview
  - security analysis (sensitive files, env-related changes, diff churn)
- Global Lottie-based loader and custom 404 page
- Responsive multi-pane review layout with resizable file tree/content area

## Tech Stack

- **Client:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, NextAuth
- **UI:** shadcn primitives, Lucide icons, Headless Tree
- **Animation:** lottie-web (`public/Coding.json`)
- **Server (optional):** Express

## Project Structure

- `client/` — main web application (dashboard, auth, PR analysis UI)
- `server/` — lightweight Express service (health endpoint scaffold)
- `data.md` — project data notes

## Prerequisites

- Node.js 20+
- npm 10+
- A GitHub OAuth App (for login)

## Environment Variables

Create `client/.env.local`:

```env
AUTH_SECRET=your_random_secret
AUTH_GITHUB_ID=your_github_oauth_client_id
AUTH_GITHUB_SECRET=your_github_oauth_client_secret
```

Notes:
- Set GitHub OAuth callback URL to:
  - `http://localhost:3000/api/auth/callback/github`
- App requests repo scope for review features.

## Run Locally

### 1) Start client

```bash
cd client
npm install
npm run dev
```

Open: `http://localhost:3000`

### 2) (Optional) Start server scaffold

```bash
cd server
npm install
node src/index.js
```

Health check: `http://localhost:5000/api/health`

## Scripts

From `client/`:

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — lint project

## Main App Routes

- `/login` — GitHub sign-in
- `/dashboard` — repository hub
- `/dashboard/[owner]/[repo]` — repo analysis workspace
- `/settings` — app settings

## Workflow

1. **Sign in with GitHub**
  - User authenticates on `/login` via NextAuth.
  - Access token is attached to session for GitHub API calls.

2. **Open a repository**
  - From `/dashboard`, paste a GitHub URL or `owner/repo`.
  - App navigates to `/dashboard/[owner]/[repo]`.

3. **Explore code by branch**
  - Select branch from the repo workspace header.
  - Browse files in the tree and preview content in the center pane.

4. **Review pull requests**
  - Use the PR panel on the right to choose a PR.
  - Click **Review** to load changed files and patch diffs.

5. **Analyze security risk**
  - Review panel computes and shows:
    - sensitive file/property changes
    - environment-related changes
    - total diff churn (added/removed lines)
  - Risk level is surfaced as Minimal/Low/Medium/High.

6. **Comment and submit review**
  - Expand PR comments to discuss changes.
  - Add comments inline in PR card thread area.
  - Submit review action (Comment / Approve / Request changes).


## Current UX Notes

- Main/global loader is shown during route transitions.
- PR analysis loader is enforced for a minimum duration before review content displays.
- Review panel supports security signals for risky changes.

## Roadmap Ideas

- Persist pane widths per repository
- Add richer PR filter/sort options
- Connect server APIs to persist app-level metadata
- Add automated tests for core PR analysis logic

---

If you want, I can also generate a contributor-focused `CONTRIBUTING.md` with coding standards and local workflow conventions.
