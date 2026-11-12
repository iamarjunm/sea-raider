import type { Metadata, Viewport } from 'next';
import { Cinzel, IM_Fell_English, Pirata_One } from 'next/font/google';
import './globals.css';
import './scene.css';

const pirata = Pirata_One({ weight: '400', subsets: ['latin'], variable: '--font-pirate', display: 'swap' });
const cinzel = Cinzel({ weight: ['600', '700', '900'], subsets: ['latin'], variable: '--font-engraved', display: 'swap' });
const fell = IM_Fell_English({ weight: '400', style: ['normal', 'italic'], subsets: ['latin'], variable: '--font-ink', display: 'swap' });

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
    <html lang="en" className={`${pirata.variable} ${cinzel.variable} ${fell.variable}`}>
      <body suppressHydrationWarning className="overflow-hidden select-none bg-black text-white">
        {children}
      </body>
    </html>
  );
}
