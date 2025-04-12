'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function EmojiGenerator({ onEmojiGenerated }: { onEmojiGenerated?: () => void }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateEmoji = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate emoji')
      }
      
      // Save to Supabase only if we got a valid image URL
      if (data.imageUrl) {
        const { error: supabaseError } = await supabase
          .from('emojis')
          .insert([{ 
            prompt, 
            image_url: data.imageUrl,
            created_at: new Date().toISOString()
          }])
          
        if (supabaseError) throw supabaseError
        
        // Clear prompt after successful generation
        setPrompt('')
        // Trigger grid refresh
        onEmojiGenerated?.()
      } else {
        throw new Error('No image URL received')
      }
      
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-8">
      <div className="flex gap-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your emoji..."
          className="flex-1 p-2 border rounded"
          disabled={loading}
        />
        <button
          onClick={generateEmoji}
          disabled={loading || !prompt.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </span>
          ) : (
            'Generate'
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  )
} 