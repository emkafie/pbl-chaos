import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import path from "path";
import fs from "fs";

/**
 * GET /api/parking-sessions
 *
 * Server-side proxy for parking session data.
 * Priority:
 *   1. Azure Blob Storage (AZURE_BLOB_SESSIONS_URL env var)
 *   2. Local fallback: scripts/dummy_parking_sessions.json
 *
 * Responds with Cache-Control: s-maxage=300 so the Next.js server
 * and any CDN edge caches the result for 5 minutes — repeated client
 * requests within that window cost zero reads/fetches.
 */
export async function GET(request: NextRequest) {
  const azureUrl = process.env.AZURE_BLOB_SESSIONS_URL;

  try {
    if (azureUrl) {
      // ── Fetch from Azure Blob Storage (server-side, no CORS issue) ──
      const response = await fetch(azureUrl, {
        // Revalidate every 5 minutes on the Next.js server cache layer
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        throw new Error(`Azure Blob responded with ${response.status}`);
      }

      const data = await response.json();

      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-Data-Source": "azure-blob",
        },
      });
    }

    // ── Fallback: local JSON file (for development / quota exceeded) ──
    const filePath = path.resolve(
      process.cwd(),
      "scripts/dummy_parking_sessions.json"
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          error:
            "No data source available. Set AZURE_BLOB_SESSIONS_URL or run generate_dummy_sessions.mjs first.",
        },
        { status: 503 }
      );
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Data-Source": "local-json-fallback",
      },
    });
  } catch (error) {
    console.error("[/api/parking-sessions] Error:", error);
    return NextResponse.json(
      { error: "Failed to load parking session data." },
      { status: 500 }
    );
  }
}
