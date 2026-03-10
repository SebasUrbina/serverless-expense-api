import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0F0D',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg width="100" height="100" viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="72" cy="72" r="60" stroke="#2D9E6B" strokeWidth="8" />
            <circle cx="72" cy="72" r="48" fill="#0F1A14" />
            <line x1="72" y1="40" x2="72" y2="104" stroke="#4EDDA0" strokeWidth="8" strokeLinecap="round" />
            <path d="M50 84L72 110L94 84" stroke="#4EDDA0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
