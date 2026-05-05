import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export async function generateMetadata(): Promise<Metadata> {
  const appUrl = process.env.APP_URL || 'https://ais-dev-nql373fydx2jsoswwhvbxm-615601803900.asia-southeast1.run.app';
  return {
    title: 'BaseChess',
    description: 'On-chain chess on Base',
    other: {
      'fc:miniapp': JSON.stringify({
        version: 'next',
        imageUrl: `${appUrl}/og-image.png`,
        button: {
          title: 'Launch BaseChess',
          action: {
            type: 'launch_miniapp',
            name: 'BaseChess',
            url: appUrl,
            splashImageUrl: `${appUrl}/splash.png`,
            splashBackgroundColor: '#0A0A0A',
          },
        },
      }),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning className="bg-[#0A0A0A] font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
