import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'Vcyber | Video Conferencing',
    template: '%s',
  },
  description: 'Vcyber is a modern video conferencing platform built for seamless communication.',
  icons: {
    icon: {
      rel: 'icon',
      url: '/images/logo.jpg',
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#0066ff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-lk-theme="default">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
