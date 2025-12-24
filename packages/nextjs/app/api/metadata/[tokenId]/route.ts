import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * API route to serve NFT metadata from the public folder
 * GET /api/metadata/[tokenId]
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ tokenId: string }> }) {
  try {
    const { tokenId } = await params;

    // Validate tokenId is a number
    if (!/^\d+$/.test(tokenId)) {
      return NextResponse.json({ error: "Invalid token ID" }, { status: 400 });
    }

    // Read metadata from public folder
    const metadataPath = join(process.cwd(), "public", "nft-metadata", `${tokenId}.json`);

    try {
      const metadata = await readFile(metadataPath, "utf-8");
      const metadataJson = JSON.parse(metadata);

      // Keep image paths as-is (relative paths work for public folder)
      // NFT marketplaces will resolve them relative to the metadata URL

      // Return metadata with proper CORS headers
      return NextResponse.json(metadataJson, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        },
      });
    } catch (fileError) {
      // If file doesn't exist, return a default metadata
      console.error(`Metadata file not found for token ${tokenId}:`, fileError);

      return NextResponse.json(
        {
          name: `MeltyFi NFT #${tokenId}`,
          description: "A unique MeltyFi NFT representing participation in the chocolate lottery ecosystem",
          image: `/nft-images/${tokenId}.png`,
          external_url: "https://meltyfi.io",
          attributes: [
            {
              trait_type: "Token ID",
              value: tokenId,
            },
          ],
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
          },
        },
      );
    }
  } catch (error) {
    console.error("Error serving metadata:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
