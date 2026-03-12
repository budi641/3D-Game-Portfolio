import { useState, useEffect } from 'react'
import { client } from '../lib/sanity'

export function usePortfolioData() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const query = `{
      "projects": *[_type == "project"] | order(order asc),
      "sections": *[_type == "section"],
      "skills": *[_type == "skill"] | order(category asc),
      "experience": *[_type == "experience"] | order(period desc),
      "education": *[_type == "education"],
      "blog": *[_type == "blog"] | order(publishedAt desc),
      "character": *[_type == "character"] | order(_updatedAt desc)[0],
      "scene": *[_type == "scene"] | order(_updatedAt desc)[0]{
        ...,
        sceneModels[]{
          ...,
          "modelFileUrl": modelFile.asset->url
        }
      }
    }`

    let cancelled = false
    const fetchData = async () => {
      try {
        const res = await client.fetch(query)
        if (!cancelled) {
          setData(res)
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    // Light polling so Studio changes reflect without manual refresh.
    const interval = window.setInterval(fetchData, 5000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return { data, loading }
}
