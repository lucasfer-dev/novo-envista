import './globals.css'
import './team-role-select.css'
import './scrollbar.css'
import './accessibility.css'
import './dashboard-spacing.css'
import './design-system.css'
import './authenticated-layout-v2.css'
import './brand-identity.css'
import type { Metadata, Viewport } from 'next'

const siteUrl = 'https://useenvista.com.br'
const siteTitle = 'Envista | Projetos, portfólio e oportunidades para estudantes'
const siteDescription = 'Publique projetos, organize equipes e transforme trabalhos acadêmicos e projetos autorais em um portfólio vivo para compartilhar em processos seletivos, competições e novas oportunidades.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: '%s | Envista' },
  description: siteDescription,
  applicationName: 'Envista',
  keywords: [
    'projetos de estudantes',
    'portfólio para estudantes',
    'portfólio de tecnologia',
    'projetos universitários',
    'projetos acadêmicos',
    'competição de inovação',
    'equipes de projetos',
    'Envista',
  ],
  alternates: { canonical: '/' },
  verification: {
    google: '4YkmCMOntxpRbRRMb4DgSN2OELdhAKqiAHCt7UtCbn0',
  },
  icons: {
    icon: [{ url: '/brand/envista-symbol-gradient.svg', type: 'image/svg+xml' }],
    shortcut: '/brand/envista-symbol-gradient.svg',
    apple: '/envista-logo.png',
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: 'Envista',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Envista — projetos que continuam depois da entrega' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/opengraph-image'],
  },
}

export const viewport: Viewport = { themeColor: '#0f1923', colorScheme: 'dark' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" data-scroll-behavior="smooth"><body>{children}</body></html>
}