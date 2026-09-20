import { genUploader } from 'uploadthing/client'

const { uploadFiles } = genUploader({ url: '/api/uploadthing' })

function supportsWebp() {
  try {
    const c = document.createElement('canvas')
    return c.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('File gambar tidak valid.'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal kompres gambar.'))), type, quality)
  })
}

// Kompres via canvas, tanpa upscale. Kembalikan File baru.
export async function compressImage(file, { maxDim = 768, quality = 0.85 } = {}) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Pilih file gambar.')
  const img = await loadImage(file)
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(img, 0, 0, w, h)
  const type = supportsWebp() ? 'image/webp' : 'image/jpeg'
  const ext = type === 'image/webp' ? 'webp' : 'jpg'
  const blob = await canvasToBlob(canvas, type, quality)
  const base = (file.name || 'foto').replace(/\.[a-z0-9]+$/i, '')
  return new File([blob], `${base}.${ext}`, { type })
}

async function uploadCompressed(file, maxDim) {
  const compressed = await compressImage(file, { maxDim, quality: 0.85 })
  const res = await uploadFiles('avatarUploader', { files: [compressed] })
  const url = res?.[0]?.url
  if (!url) throw new Error('Upload gagal. Coba lagi.')
  return url
}

export function uploadAvatar(file) {
  return uploadCompressed(file, 768)
}

export function uploadLinkIcon(file) {
  return uploadCompressed(file, 256)
}
