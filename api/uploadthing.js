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

export default createRouteHandler({ router })
