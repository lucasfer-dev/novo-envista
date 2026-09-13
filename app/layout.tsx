import './globals.css'
import './team-role-select.css'
import './scrollbar.css'
import './accessibility.css'
import './dashboard-spacing.css'
import './design-system.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://useenvista.com.br'),
  title: { default: 'Envista — ideias que continuam', template: '%s | Envista' },
  description: 'Aprenda, construa projetos, forme equipes e transforme ideias em oportunidades no Envista.',
  applicationName: 'Envista',
  alternates: { canonical: '/' },
  icons: {
    icon: [{ url: '/envista-logo.png', type: 'image/png', sizes: '150x150' }],
    shortcut: '/envista-logo.png',
    apple: '/envista-logo.png',
  },
  openGraph: {
    title: 'Envista — ideias que continuam',
    description: 'Aprenda, construa projetos, forme equipes e transforme ideias em oportunidades.',
    url: 'https://useenvista.com.br',
    siteName: 'Envista',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Envista — ideias que continuam' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Envista — ideias que continuam',
    description: 'Aprenda, construa projetos, forme equipes e transforme ideias em oportunidades.',
    images: ['/twitter-image'],
  },
}

export const viewport: Viewport = { themeColor: '#0b141f', colorScheme: 'dark' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" data-scroll-behavior="smooth"><body>{children}</body></html>
}
