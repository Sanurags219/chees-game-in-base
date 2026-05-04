import { type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL || 'https://ais-dev-nql373fydx2jsoswwhvbxm-615601803900.asia-southeast1.run.app';
  
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjkxNTIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMmVmNzkwRGQ3OTkzQTM1ZkQ4NDdDMDUzRURkQUU5NDBEMDU1NTk2In0",
      payload: "eyJkb21haW4iOiJhaXMtZGV2LW5xbDM3M2Z5ZHgyanNvc3d3aHZieG0tNjE1NjAxODAzOTAwLmFzaWEtc291dGhlYXN0MS5ydW4uYXBwIn0",
      signature: "MHhkY2FmYTIyZjZlNDhlZWVkZWE0NzhjZTVmNDk4YmY5MjU5ZTIxOGU3Y2E2YmYwYTQ2ZTE5YjQ0OTRkZDkzYWY0NTg4Y2FhYzkyYmNiMTM5NjA5Zjg4ZmRmYThlZDRiYWM3MGQ3Y2I5YTJlYzE0ZTMwN2RkNDliODFjYjVmYzY1ODFi"
    },
    miniapp: {
      version: "1",
      name: "BaseChess",
      homeUrl: appUrl,
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#0A0A0A",
      webhookUrl: `${appUrl}/api/webhook`,
      subtitle: "On-Chain Chess on Base",
      description: "A 10-level on-chain chess challenge on Base.",
      screenshotUrls: [
        `${appUrl}/screenshot1.png`
      ],
      primaryCategory: "social",
      tags: ["chess", "gaming", "base", "miniapp"],
      heroImageUrl: `${appUrl}/hero.png`,
      tagline: "Challenge the AI on Base",
      ogTitle: "BaseChess",
      ogDescription: "The ultimate on-chain chess experience.",
      ogImageUrl: `${appUrl}/og-image.png`,
      noindex: false
    }
  };

  return Response.json(manifest);
}
