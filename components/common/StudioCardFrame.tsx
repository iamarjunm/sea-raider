import type { CSSProperties, ReactNode } from 'react';

interface StudioCardFrameProps {
  children: ReactNode;
  className?: string;
  tint?: string;
}

/** Reusable Ethereal Gold Studios purchase-card frame. Keep all wording in HTML. */
export default function StudioCardFrame({ children, className = '', tint = 'rgba(2, 8, 22, .24)' }: StudioCardFrameProps) {
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(155deg, ${tint}, rgba(2, 6, 16, .76)), url('/assets/aistudio/egs-gold-card-frame.webp')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
  return <div className={`studio-card-frame ${className}`} style={style}>{children}</div>;
}
