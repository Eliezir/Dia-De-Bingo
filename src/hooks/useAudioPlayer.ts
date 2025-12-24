import { useCallback, useRef } from 'react'

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playAudio = useCallback(async (audioPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const audio = new Audio(audioPath)
      audioRef.current = audio

      audio.volume = 0.7

      audio.onended = () => {
        audioRef.current = null
        resolve()
      }

      audio.onerror = (error) => {
        audioRef.current = null
        reject(error)
      }

      audio.play().catch((error) => {
        audioRef.current = null
        reject(error)
      })
    })
  }, [])

  return { playAudio }
}

