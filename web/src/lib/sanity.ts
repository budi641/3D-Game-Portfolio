import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

export const client = createClient({
  projectId: 'wsg4349i',
  dataset: 'production',
  // Disable CDN to always fetch fresh data from API (avoids stale/empty cache)
  useCdn: false,
  apiVersion: '2023-05-03',
})

const builder = createImageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}
