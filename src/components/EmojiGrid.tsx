'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type Emoji = {
  id: string
  prompt: string
  image_url: string
  created_at: string
  likes: number
}

function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function EmojiGrid() {
  const [emojis, setEmojis] = useState<Emoji[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEmojis()
    // Set up real-time subscription
    const channel = supabase
      .channel('emoji_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'emojis' 
      }, () => {
        fetchEmojis()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchEmojis = async () => {
    try {
      const { data, error } = await supabase
        .from('emojis')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Filter out emojis with invalid URLs
      const validEmojis = data?.filter(emoji => isValidUrl(emoji.image_url)) || []
      setEmojis(validEmojis)
      setError(null)
    } catch (err) {
      console.error('Error fetching emojis:', err)
      setError('Failed to load emojis')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emojis')
        .update({ likes: (emojis.find(e => e.id === id)?.likes || 0) + 1 })
        .eq('id', id)

      if (error) throw error
      fetchEmojis()
    } catch (err) {
      console.error('Error liking emoji:', err)
    }
  }

  const downloadEmoji = (url: string, prompt: string) => {
    if (!isValidUrl(url)) {
      console.error('Invalid URL:', url)
      return
    }
    
    const link = document.createElement('a')
    link.href = url
    link.download = `emoji-${prompt.replace(/\s+/g, '-')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        {error}
      </div>
    )
  }

  if (emojis.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No emojis generated yet. Try creating one!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {emojis.map((emoji) => (
        <div key={emoji.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="relative aspect-square">
            {isValidUrl(emoji.image_url) ? (
              <Image
                src={emoji.image_url}
                alt={emoji.prompt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-100">
                <p className="text-sm text-gray-500">Invalid image</p>
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={emoji.prompt}>
              {emoji.prompt}
            </p>
            <div className="flex justify-between items-center">
              <button
                onClick={() => handleLike(emoji.id)}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                ❤️ {emoji.likes || 0}
              </button>
              <button
                onClick={() => downloadEmoji(emoji.image_url, emoji.prompt)}
                className="text-sm text-blue-500 hover:text-blue-700 transition-colors"
                disabled={!isValidUrl(emoji.image_url)}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 