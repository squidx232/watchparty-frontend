import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pillow Watch - Cozy Watch Parties',
  description: 'Get cozy and watch videos together with friends. Your virtual living room for movie nights.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className={inter.className}>
        {children}
        <footer className="fixed bottom-2 left-0 right-0 text-center text-xs text-gray-500 font-mono z-50 pointer-events-none">
          built by{' '}
          <a 
            href="https://linkedin.com/in/whereishassan" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors pointer-events-auto"
          >
            @whereishassan
          </a>
        </footer>
      </body>
    </html>
  );
}
