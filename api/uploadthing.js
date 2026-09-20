import express from 'express'
import { createUploadthing } from 'uploadthing/server'
import { createRouteHandler } from 'uploadthing/express'

const f = createUploadthing()

const router = {
  avatarUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } }, { awaitServerData: false })
    // TODO: validasi user (cek sesi/auth) di sini sebelum mengizinkan upload.
    .middleware(() => ({}))
    .onUploadComplete(({ file }) => {
      console.log('Upload selesai:', file.ufsUrl)
    }),
}

const uploadthingHandler = createRouteHandler({ router })

const app = express()
// Vercel memanggil file ini untuk SEMUA method/path di bawah /api/uploadthing,
// tapi handler UT di-mount di path "/" (Router().all("/")). Tanpa normalisasi,
// POST /api/uploadthing?slug=...&actionType=... jatuh ke 404 HTML Express →
// client gagal parse JSON ("Failed to parse response"). Tulis ulang path ke "/"
// (query dipertahankan) sebelum delegasi. JANGAN tambah express.json():
// getPostBody UT membaca raw stream bila req.body tak ada, dan justru menolak
// bila body sudah ter-parse tapi bukan object.
app.use((req, _res, next) => {
  const q = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  req.url = '/' + q
  next()
})
app.use(uploadthingHandler)

export default app
