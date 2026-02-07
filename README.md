# 🏭 DApp Store Backend: Industrial Data Factory

This repository serves as the **Industrial Data Factory** for an automated pSEO DApp Store. Its core purpose is to process raw DApp metadata and assets, transform them into optimized formats, and make them available for a separate frontend application.

## 💡 Core Philosophy: Data as Code

All DApp metadata and configurations live directly within this repository as structured data files. Changes to these files drive the entire update process, ensuring version control, auditability, and a clear source of truth.

## ✨ Key Features

-   **Folder-per-App Structure:** Each DApp's metadata (`meta.json`) and local assets (e.g., `logo.png`) reside in its own dedicated folder (`/data/apps/<slug>/`).
-   **Zod Schema Validation:** Ensures strict data integrity for all `meta.json` files.
-   **Distiller Engine:** Processes all DApp data, uploads local logos to Cloudinary, and generates optimized JSON outputs.
-   **Cloudinary Integration:** Automatically uploads local DApp logos and replaces references with permanent CDN URLs (optimized with `f_auto, q_auto`).
-   **Automated Data Generation:** Produces `data/apps.min.json` (minified listings for frontend consumption) and `data/slugs.json` (for sitemap/routing).
-   **GitHub Actions CI/CD:** Automates validation on Pull Requests and the full distillation process (including auto-committing processed data) on merges to `main`.
-   **Fastify API:** Provides a minimal, protected API endpoint to manually trigger the distillation process.

## 🚀 Getting Started (Development)

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18 or newer recommended)
-   [pnpm](https://pnpm.io/installation)

### Installation

1.  Clone this repository:
    ```bash
    git clone https://github.com/your-org/backend-dappstore.git
    cd backend-dappstore
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Environment Variables (`.env`)

Create a `.env` file in the root of this directory with the following variables. Replace placeholder values with your actual credentials.

```dotenv
# API Key for securing backend endpoints (choose a strong, unique key)
API_KEY="your_secret_api_key_here"

# Cloudinary Credentials (from your Cloudinary Dashboard)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

### Running the Development Server

To start the Fastify API server in development mode (with hot-reloading):

```bash
pnpm dev
```

The server will listen on `http://localhost:3000`.

### Running Scripts Manually

You can also run the core scripts independently:

-   **Validate DApp data:**
    ```bash
    pnpm ts-node src/scripts/validate.ts
    ```
-   **Distill DApp data (and upload local logos to Cloudinary):**
    ```bash
    pnpm ts-node src/scripts/distill.ts
    ```
    *Note: The `distill.ts` script requires Cloudinary environment variables to be set.*

## 📂 Data Structure & Contribution

### `/data/apps/<slug>/meta.json`

Each DApp is defined by a `meta.json` file within its own slug-named folder.

**To add or modify a DApp:**

1.  Create a new folder: `/data/apps/<your-dapp-slug>/`. The folder name **MUST** match the `slug` field inside `meta.json`.
2.  Inside this folder, create `meta.json` following the schema defined in `lib/schema.ts`.
3.  **For `logoUrl`:**
    -   If you have a local logo image (e.g., `logo.png`), place it in the same DApp folder (`/data/apps/<your-dapp-slug>/logo.png`).
    -   Set `"logoUrl": "./logo.png"` in your `meta.json`. The distillation process will automatically upload this and update `logoUrl` to a CDN link.
    -   If you already have a CDN URL for the logo, you can use that directly.
4.  Ensure all required fields are present and valid according to `lib/schema.ts`.

**Example `data/apps/my-cool-dapp/meta.json`:**

```json
{
  "slug": "my-cool-dapp",
  "name": "My Cool DApp",
  "logoUrl": "./logo.png",
  "category": "gaming",
  "chains": ["polygon", "ethereum"],
  "content": {
    "short": "A fantastic new decentralized application for gamers.",
    "description": "Dive into a new world with My Cool DApp, offering unique gameplay and digital collectibles.",
    "meta": "Play My Cool DApp on Polygon and Ethereum.",
    "pageTitle": "My Cool DApp - Web3 Gaming"
  },
  "links": {
    "website": "https://mycooldapp.com",
    "twitter": "https://twitter.com/mycooldapp"
  },
  "relations": {}
}
```

## 🌐 API Endpoints

### `POST /api/distill`

Triggers the `src/scripts/distill.ts` script programmatically. This endpoint is primarily for manual or programmatic triggering of the data processing outside of the CI/CD pipeline.

-   **Method:** `POST`
-   **URL:** `http://localhost:3000/api/distill`
-   **Headers:**
    -   `x-api-key: your_secret_api_key_here` (from your `.env`)
    -   `Content-Type: application/json`
-   **Body:** `{}` (empty JSON object)

## 🤖 Automation & CI/CD Workflow

This repository utilizes GitHub Actions (`.github/workflows/deploy-data.yml`) to automate the data processing pipeline.

### On Pull Request (PR)

-   When a PR is opened against `main`, the `validate-data` job runs `src/scripts/validate.ts`.
-   This ensures that all `meta.json` files in the PR (new or modified) conform to the schema and naming conventions.
-   **A failing validation will block the PR merge.**

### On Merge to `main`

-   When a PR is merged into the `main` branch, the `deploy-data` job runs.
-   It executes `src/scripts/distill.ts`, which:
    1.  Validates all `meta.json` files.
    2.  Uploads any local `logoUrl` images to Cloudinary (updating `meta.json` files in place).
    3.  Generates `data/apps.min.json` and `data/slugs.json`.
-   **Auto-Commit:** The workflow then automatically commits these processed/generated files (`meta.json`s with CDN links, `apps.min.json`, `slugs.json`) back to the `main` branch of this repository. This step is crucial for maintaining "Data as Code."

## 🚀 Frontend Data Consumption

A separate frontend application (e.g., built with Next.js) consumes the processed data from this repository by directly fetching the raw GitHub URL of `data/apps.min.json`. It typically uses Next.js's `revalidate` mechanism to ensure the site's content stays fresh.

---