import express from 'express'
import { createUploadthing } from 'uploadthing/server'
import { createRouteHandler } from 'uploadthing/express'

const f = createUploadthing()

const router = {
  avatarUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    // TODO: validasi user (cek sesi/auth) di sini sebelum mengizinkan upload.
    .middleware(() => ({}))
    .onUploadComplete(({ file }) => {
      console.log('Upload selesai:', file.ufsUrl)
    }),
}

const app = express()
app.use(createRouteHandler({ router }))

export default app
