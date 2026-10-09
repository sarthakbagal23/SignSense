import '../src/index.css';
import '../src/landing/landing.css';
import '../src/app/app-redesign.css';

export const metadata = {
  title: 'SignSense: a coach for the first conversation',
  description: 'A camera-based ASL fingerspelling practice coach for hearing family members learning to connect, one clear cue at a time.',
  icons: { icon: '/mascot/wave-small.png' },
};

export const viewport = {
  colorScheme: 'dark',
  themeColor: '#080d12',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
