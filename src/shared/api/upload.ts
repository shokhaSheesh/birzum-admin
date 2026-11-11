import { api } from './client'

export type UploadedFile = { url: string; name: string; size: number }

/** Uploads a picture (jpeg, png, up to 5 MiB) or a PDF (up to 10 MiB); the URL goes into the content calls. */
export function uploadFile(file: File, purpose: 'image' | 'document'): Promise<UploadedFile> {
  const form = new FormData()
  form.append('purpose', purpose)
  form.append('file', file)
  return api<UploadedFile>('POST', '/admin/files', { form })
}
