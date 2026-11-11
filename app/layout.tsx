import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sea Raider - Echoes of the Warrior',
  description: 'High-volatility 5x3 pirate slot game with Bonus Chance, Super Bonus Chance, Pirates Chance, Feature Spin, Unknown Bonus, and Ethereal Cataclysm 50,000x Max Win.',
  openGraph: {
    title: 'Sea Raider - Echoes of the Warrior',
    description: 'High-volatility 5x3 pirate slot game with Bonus Chance, Super Bonus Chance, Pirates Chance, Feature Spin, Unknown Bonus, and Ethereal Cataclysm 50,000x Max Win.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sea Raider - Echoes of the Warrior',
    description: 'High-volatility 5x3 pirate slot game with Bonus Chance, Super Bonus Chance, Pirates Chance, Feature Spin, Unknown Bonus, and Ethereal Cataclysm 50,000x Max Win.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="overflow-hidden select-none bg-black text-white">
        {children}
      </body>
    </html>
  );
}
