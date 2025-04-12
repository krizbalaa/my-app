'use client';

import dynamic from 'next/dynamic'

const EmojiGenerator = dynamic(() => import('@/components/EmojiGenerator').then(mod => mod.EmojiGenerator), {
  ssr: false
})

const EmojiGrid = dynamic(() => import('@/components/EmojiGrid').then(mod => mod.EmojiGrid), {
  ssr: false
})

export function ClientWrapper() {
  return (
    <>
      <EmojiGenerator />
      <EmojiGrid />
    </>
  )
} 