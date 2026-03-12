import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

export const client = createClient({
  projectId: 'wsg4349i',
  dataset: 'production',
  // In dev we want fresh updates from Studio (no CDN cache).
  useCdn: import.meta.env.PROD,
  apiVersion: '2023-05-03',
})

const builder = createImageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}
