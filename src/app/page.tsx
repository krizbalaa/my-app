'use client'

import { useState } from 'react'
import { EmojiGenerator } from '@/components/EmojiGenerator'
import { EmojiGrid } from '@/components/EmojiGrid'

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEmojiGenerated = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Image Generator</h1>
      <EmojiGenerator onEmojiGenerated={handleEmojiGenerated} />
      <EmojiGrid key={refreshKey} />
    </main>
  )
}
