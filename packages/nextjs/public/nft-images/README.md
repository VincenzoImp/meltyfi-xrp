# NFT Images

Place your NFT images in this folder with the following naming convention:
- `0.png` - NFT image for token ID 0
- `1.png` - NFT image for token ID 1
- `2.png` - NFT image for token ID 2
- etc.

Supported formats: PNG, JPG, GIF, SVG

The images will be accessible at `/nft-images/{tokenId}.png` or via the metadata API route.

## Example
If you place an image at `public/nft-images/0.png`, it will be accessible at:
- Direct URL: `http://localhost:3000/nft-images/0.png`
- Via metadata: The metadata JSON at `/api/metadata/0` will reference `/nft-images/0.png`
