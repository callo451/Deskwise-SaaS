import { MegaMenuHeader } from '@/components/layout/MegaMenuHeader'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <MegaMenuHeader />
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
