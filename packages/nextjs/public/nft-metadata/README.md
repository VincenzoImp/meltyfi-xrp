# NFT Metadata

This folder contains JSON metadata files for NFTs. Each file should be named with the token ID (e.g., `0.json`, `1.json`, etc.).

## Structure

The metadata follows the OpenSea/ERC721 metadata standard:

```json
{
  "name": "NFT Name",
  "description": "NFT Description",
  "image": "/nft-images/0.png",
  "external_url": "https://meltyfi.io",
  "attributes": [
    {
      "trait_type": "Trait Name",
      "value": "Trait Value"
    }
  ]
}
```

## How It Works

1. **Local Development**: Metadata is served from `http://localhost:3000/api/metadata/[tokenId]`
2. **Production**: Metadata is served from `https://meltyfi-xrp.vercel.app/api/metadata/[tokenId]`
3. **Fallback**: If a specific metadata file doesn't exist, the API returns a default template
4. **Images**: Reference images using relative paths like `/nft-images/0.png`

## API Route

The Next.js API route at `/app/api/metadata/[tokenId]/route.ts`:
- Reads metadata from this folder
- Converts relative image URLs to absolute URLs
- Handles CORS for cross-origin requests
- Provides caching headers for performance
- Returns default metadata if file doesn't exist

## Adding New NFT Metadata

1. Create a new JSON file named `{tokenId}.json` (e.g., `3.json`)
2. Add the corresponding image to `/public/nft-images/`
3. Reference the image in metadata using `/nft-images/{tokenId}.png`
4. The metadata will automatically be available at `/api/metadata/{tokenId}`

## Example

For token ID 0:
- Metadata file: `/public/nft-metadata/0.json`
- Image file: `/public/nft-images/0.png`
- API endpoint: `http://localhost:3000/api/metadata/0`
- Contract returns: `http://localhost:3000/api/metadata/0` (via tokenURI function)
