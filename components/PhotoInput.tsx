'use client'

import { useRef, useState } from 'react'

/** Picks a photo, shrinks it to a square-ish 800px JPEG in the browser, then uploads it. */
export function PhotoInput({ action, current, name, hidden }: {
  action: (fd: FormData) => Promise<{ ok?: string; error?: string }>
  current: string | null
  name: string
  hidden?: Record<string, string>
}) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(current)
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function onPick(file: File | undefined) {
    if (!file) return
    setBusy(true); setMsg(null)
    try {
      const blob = await shrink(file)
      const fd = new FormData()
      Object.entries(hidden ?? {}).forEach(([k, v]) => fd.append(k, v))
      fd.append('photo', blob, 'photo.jpg')
      const res = await action(fd)
      setMsg(res)
      if (res.ok) setPreview(URL.createObjectURL(blob))
    } catch (e) {
      setMsg({ error: e instanceof Error ? e.message : 'Could not use this image.' })
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="photo-input">
      <Avatar src={preview} name={name} size={96} />
      <div className="stack" style={{ gap: 6 }}>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onPick(e.target.files?.[0])} />
        <button type="button" className="btn small ghost" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? 'Uploading…' : preview ? 'Change photo' : 'Upload photo'}
        </button>
        <span className="fine">A clear, friendly photo of your face. JPG or PNG.</span>
        {msg?.error && <span className="note bad">{msg.error}</span>}
        {msg?.ok && <span className="note ok">{msg.ok}</span>}
      </div>
    </div>
  )
}

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('This file is not an image we can read.') })
  const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process the image.'))), 'image/jpeg', 0.86))
}

export function Avatar({ src, name, size = 56 }: { src: string | null; name: string; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return src
    ? <img className="avatar" src={src} alt={name} width={size} height={size} style={{ width: size, height: size }} loading="lazy" />
    : <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-label={name}>{initials}</span>
}
