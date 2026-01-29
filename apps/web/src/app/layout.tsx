import { DM_Sans, Outfit } from 'next/font/google'

import type { Metadata } from 'next'

import Providers from '@/components/providers'
import '../index.css'

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

const outfit = Outfit({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PetLar - Sistema de Adoção',
  description:
    'Encontre seu novo melhor amigo. Sistema de gestão de adoção de gatos.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${outfit.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
