import './globals.css';
import { Inter } from 'next/font/google';
import { SearchProvider } from "@/lib/search-context";
import { Header } from '@/components/header';
import { Metadata } from 'next';
import { Toaster } from "@/components/ui/sonner";
import { NextAuthProvider } from "@/lib/providers";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800']
});

export const metadata: Metadata = {
  title: "Costera",
  description: "Costera - Business Intelligence Platform",
  openGraph: {
    title: "Costera",
    description: "Costera - Business Intelligence Platform",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <SearchProvider>
        <NextAuthProvider>
          <body>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster />
          </body>
        </NextAuthProvider>
      </SearchProvider>
    </html>
  );
}
