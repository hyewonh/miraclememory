import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          color: '#1c1917', // stone-900
          fontSize: 24,
          fontWeight: 900,
          fontFamily: 'serif',
          lineHeight: 1,
        }}
      >
        M
      </div>
    ),
    { ...size }
  )
}
