import { useCallback, useEffect, useRef, useState } from 'react'

// Minimal typing for the browser Web Speech API (Chrome / Edge expose it as webkitSpeechRecognition)
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } }
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> }
type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type RecognitionCtor = new () => Recognition

const Ctor = (): RecognitionCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}
export const speechSupported = () => !!Ctor()

export type SpeechState = 'idle' | 'recording' | 'paused'

/**
 * Live transcription from the microphone. Each finished sentence goes to `onFinal`;
 * the sentence being spoken is in `interim`. The browser stops listening after silence,
 * so it restarts itself while recording.
 */
export default function useSpeech(lang: string, onFinal: (text: string) => void) {
  const [state, setState] = useState<SpeechState>('idle')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string>()
  const [seconds, setSeconds] = useState(0)
  const rec = useRef<Recognition | null>(null)
  const want = useRef(false)
  const final = useRef(onFinal)
  final.current = onFinal

  useEffect(() => {
    if (state !== 'recording') return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [state])

  const begin = useCallback(() => {
    const C = Ctor()
    if (!C) {
      setError('เบราว์เซอร์นี้ไม่รองรับการแปลงเสียงเป็นข้อความ กรุณาใช้ Chrome หรือ Edge')
      return
    }
    const r = new C()
    r.lang = lang
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      let live = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        const text = res[0].transcript.trim()
        if (res.isFinal) text && final.current(text)
        else live += res[0].transcript
      }
      setInterim(live.trim())
    }
    r.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      want.current = false
      setState('idle')
      setError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน กรุณาอนุญาตในแถบที่อยู่ของเบราว์เซอร์' : `แปลงเสียงไม่สำเร็จ (${e.error})`)
    }
    r.onend = () => {
      setInterim('')
      if (want.current) r.start()
    }
    rec.current = r
    want.current = true
    setError(undefined)
    r.start()
    setState('recording')
  }, [lang])

  const pause = useCallback(() => {
    want.current = false
    rec.current?.stop()
    setState('paused')
  }, [])

  const stop = useCallback(() => {
    want.current = false
    rec.current?.stop()
    setState('idle')
  }, [])

  useEffect(() => () => {
    want.current = false
    rec.current?.stop()
  }, [])

  return { state, interim, error, seconds, start: begin, pause, stop, reset: () => setSeconds(0) }
}
