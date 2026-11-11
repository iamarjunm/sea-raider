'use client';

import Image from 'next/image';

interface StudioLoadingScreenProps {
  studioName?: string;
  gameName?: string;
  logoSrc?: string;
}

export default function StudioLoadingScreen({
  studioName = 'ETHEREAL GOLD STUDIOS',
  gameName = 'Loading game…',
  logoSrc = '/assets/aistudio/provider_logo_ee1a8c04.webp',
}: StudioLoadingScreenProps) {
  return (
    <div className="studio-loader" role="status" aria-live="polite">
      <div className="studio-loader__halo" aria-hidden="true" />
      <div className="studio-loader__logo-wrap">
        <div className="studio-loader__orbit" aria-hidden="true" />
        <Image src={logoSrc} alt={studioName} fill priority sizes="min(72vw, 360px)" className="object-contain" />
      </div>
      <div className="studio-loader__name">{studioName}</div>
      <div className="studio-loader__game">{gameName}</div>
      <div className="studio-loader__track" aria-hidden="true"><span /></div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
