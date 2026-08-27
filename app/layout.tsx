import './globals.css'
import './team-role-select.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Envista',
  description: 'Aprenda, construa e transforme ideias em oportunidades.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" data-scroll-behavior="smooth"><body>{children}</body></html>
}
