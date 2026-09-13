import { ImageResponse } from 'next/og'

export const alt = 'Envista — ideias que continuam'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 82px',
          background: '#0b141f',
          color: '#f4f7fb',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 14,
              background: '#00bfa6',
              color: '#032a25',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 30,
            }}
          >
            E
          </div>
          <span style={{ fontSize: 34, fontWeight: 750, letterSpacing: '-1px' }}>Envista</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 920 }}>
          <span style={{ color: '#62ddcd', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
            APRENDA · CONSTRUA · EVOLUA
          </span>
          <div style={{ fontSize: 68, fontWeight: 780, lineHeight: 1.04, letterSpacing: '-3px' }}>
            Ideias que continuam.
          </div>
          <div style={{ color: '#a9b7c7', fontSize: 27, lineHeight: 1.35, marginTop: 24 }}>
            Projetos, equipes, aprendizado e oportunidades em um único ecossistema.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#718399', fontSize: 20 }}>
          <span>useenvista.com.br</span>
          <span style={{ color: '#62ddcd' }}>Construa algo que continue.</span>
        </div>
      </div>
    ),
    size,
  )
}
