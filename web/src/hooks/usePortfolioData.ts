import { useState, useEffect } from 'react'
import { client } from '../lib/sanity'

let portfolioCache: any = null

export function usePortfolioData() {
  const [data, setData] = useState<any>(portfolioCache)
  const [loading, setLoading] = useState(!portfolioCache)

  useEffect(() => {
    const query = `{
      "projects": *[_type == "project"] | order(order asc){
        ...,
        "mainImageUrl": mainImage.asset->url,
        media[]{
          ...,
          "imageUrl": image.asset->url,
          "videoUrl": video.asset->url
        },
        gallery[]{
          ...,
          "url": asset->url
        }
      },
      "sections": *[_type == "section"] | order(order asc),
      "skills": *[_type == "skill"] | order(order asc, category asc, title asc),
      "experience": *[_type == "experience"] | order(period desc),
      "education": *[_type == "education"],
      "blog": *[_type == "blog"] | order(publishedAt desc){
        ...,
        media[]{
          ...,
          "imageUrl": image.asset->url,
          "videoUrl": video.asset->url
        }
      },
      "siteSettings": *[_type == "siteSettings"] | order(_updatedAt desc)[0],
      "character": *[_type == "character"] | order(_updatedAt desc)[0],
      "scene": *[_type == "scene"] | order(_updatedAt desc)[0]{
        ...,
        "sectionRelics": coalesce(sectionRelics, {}){
          "projects": coalesce(projects, {}){ label, url, color, modelScale, modelPosition },
          "education": coalesce(education, {}){ label, url, color, modelScale, modelPosition },
          "work": coalesce(work, {}){ label, url, color, modelScale, modelPosition },
          "skills": coalesce(skills, {}){ label, url, color, modelScale, modelPosition },
          "contact": coalesce(contact, {}){ label, url, color, modelScale, modelPosition },
          "about": coalesce(about, {}){ label, url, color, modelScale, modelPosition },
          "blog": coalesce(blog, {}){ label, url, color, modelScale, modelPosition }
        },
        "linkRelics": coalesce(linkRelics, {}),
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
          portfolioCache = res
          setData(res)
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()

    const onVisibilityChange = () => {
      if (!document.hidden) {
        portfolioCache = null
        fetchData()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    const interval = window.setInterval(() => {
      if (document.hidden) return
      fetchData()
    }, 10000)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.clearInterval(interval)
    }
  }, [])

  return { data, loading }
}
