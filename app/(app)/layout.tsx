import { Header } from '@/components/header';
import { SimpleFooter } from '@/components/simple-footer';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col">
        {children}
      </main>
      <SimpleFooter />
    </div>
  )
} 