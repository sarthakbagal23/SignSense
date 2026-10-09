import '../src/index.css';
import '../src/landing/landing.css';
import '../src/app/app-redesign.css';

export const metadata = {
  title: 'SignSense — Practice one handshape at a time',
  description: 'A thoughtful on-device fingerspelling practice space for hearing family members learning alongside Deaf people.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b1718',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
