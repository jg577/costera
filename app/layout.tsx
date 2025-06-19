import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { NextAuthProvider } from '@/lib/providers';

const inter = Inter({
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <NextAuthProvider>
        <body>
          {children}
          <Toaster />
        </body>
      </NextAuthProvider>
    </html>
  );
}
