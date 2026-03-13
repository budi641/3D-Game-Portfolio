import { useState, useEffect, type FormEvent } from 'react'
import { urlFor } from '../lib/sanity'
import { buildDisplaySkills, SkillIcon } from '../lib/skillsDisplay'

function hexToRgba(hex: string, alpha: number) {
  const safe = (hex || '').trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(safe)) return `rgba(14,23,42,${alpha})`
  const r = parseInt(safe.slice(0, 2), 16)
  const g = parseInt(safe.slice(2, 4), 16)
  const b = parseInt(safe.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function imageUrl(source: any, width = 800, height = 450) {
  if (!source) return null
  try {
    return urlFor(source).width(width).height(height).fit('crop').auto('format').url()
  } catch {
    return null
  }
}

function imageUrlNoCrop(source: any, maxWidth = 1200, maxHeight = 1200) {
  if (!source) return null
  try {
    return urlFor(source)
      .ignoreImageParams()
      .width(maxWidth)
      .height(maxHeight)
      .fit('max')
      .auto('format')
      .url()
  } catch {
    return null
  }
}

function experienceImage(exp: any, data: any) {
  return exp?.logo || exp?.image || exp?.mainImage || exp?.companyImage || data?.projects?.[0]?.mainImage || null
}

function portableToPlain(value: any): string {
  if (!Array.isArray(value)) return ''
  return value
    .map((block: any) => {
      if (!block || block._type !== 'block' || !Array.isArray(block.children)) return ''
      return block.children.map((child: any) => child?.text || '').join('')
    })
    .filter(Boolean)
    .join('\n\n')
}

function youtubeEmbedUrl(url: string): string | null {
  if (!url) return null
  const clean = url.trim()
  const short = clean.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/)
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`
  const full = clean.match(/[?&]v=([A-Za-z0-9_-]{6,})/)
  if (full?.[1]) return `https://www.youtube.com/embed/${full[1]}`
  return null
}

function monthToNum(v: string) {
  const m = v.toLowerCase().slice(0, 3)
  const map: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  }
  return typeof map[m] === 'number' ? map[m] : 0
}

function parsePeriodStart(period: string | undefined): number {
  if (!period || typeof period !== 'string') return 0
  const first = period.split('–')[0]?.trim() || period.split('-')[0]?.trim() || ''
  const y = first.match(/\b(19|20)\d{2}\b/)
  if (!y) return 0
  const year = Number(y[0])
  const monthToken = first.replace(y[0], '').trim().split(/\s+/)[0] || 'jan'
  const month = monthToNum(monthToken)
  return new Date(year, month, 1).getTime()
}

function groupedWork(experiences: any[]) {
  const groups = new Map<string, { company: string; logo?: any; roles: any[] }>()
  ;(experiences || []).forEach((exp) => {
    const company = exp?.company || 'Unknown Company'
    const key = company.toLowerCase().trim()
    if (!groups.has(key)) groups.set(key, { company, logo: exp?.logo, roles: [] })
    const g = groups.get(key)!
    g.logo = g.logo || exp?.logo
    g.roles.push(exp)
  })
  const arr = Array.from(groups.values())
  arr.forEach((g) => {
    g.roles.sort((a, b) => parsePeriodStart(b?.period) - parsePeriodStart(a?.period))
  })
  arr.sort((a, b) => parsePeriodStart(b.roles[0]?.period) - parsePeriodStart(a.roles[0]?.period))
  return arr
}

export function StatueContentRenderer({
  type,
  data,
  color = '#3b82f6',
}: {
  type: string
  data: any
  color?: string
}) {
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [contactSending, setContactSending] = useState(false)
  const [contactStatus, setContactStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [expandedBlogId, setExpandedBlogId] = useState<string | null>(null)

  useEffect(() => {
    if (type !== 'blog') setExpandedBlogId(null)
  }, [type])

  const submitContact = async (e: FormEvent) => {
    e.preventDefault()
    const recipient = data?.siteSettings?.contactRecipientEmail || ''
    if (!recipient) {
      setContactStatus('error')
      return
    }
    setContactSending(true)
    setContactStatus('idle')
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(contactForm),
      })
      if (!res.ok) throw new Error('send failed')
      setContactStatus('success')
      setContactForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setContactStatus('error')
    } finally {
      setContactSending(false)
    }
  }

  if (!data) return <div className="text-white/40 font-mono text-[10px] uppercase animate-pulse">Synchronizing_Datastream...</div>

  switch (type) {
    case 'projects':
      return (
        <div className="space-y-4">
          {(data.projects || []).map((p: any) => (
            <div key={p._id} className={`p-5 ui-context-card group ${p?.featured ? 'border-amber-300/70 shadow-[0_0_20px_rgba(245,158,11,0.25)]' : ''}`}>
              <div className="mb-4 h-36 rounded-xl overflow-hidden border border-white/10 bg-black/40 relative">
                {imageUrl(p.mainImage, 640, 360) ? (
                  <img src={imageUrl(p.mainImage, 640, 360)!} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white/35 tracking-[0.25em]">NO_PREVIEW</div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white text-base">{p.title}</h3>
                <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-mono text-white/50">{p.year || '2024'}</div>
              </div>
              <p className="text-xs text-white/50 line-clamp-2 mb-3 leading-relaxed">{p.description}</p>
              {Array.isArray(p.links) &&
                p.links
                  .map((l: any) => youtubeEmbedUrl(l?.url || ''))
                  .filter(Boolean)
                  .slice(0, 1)
                  .map((embed: any, i: number) => (
                    <div key={`yt-inline-${i}`} className="mb-3 rounded-lg overflow-hidden border border-white/10 bg-black/30">
                      <iframe src={embed} title={`project-yt-${p._id}-${i}`} className="w-full h-40" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
                    </div>
                  ))}
              {Array.isArray(p.links) && p.links.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {p.links.slice(0, 3).map((l: any, idx: number) => (
                    <a key={`${l?.url || 'link'}-${idx}`} href={l?.url || '#'} target="_blank" rel="noreferrer" className="text-[9px] px-2 py-1 rounded border border-white/10 bg-black/30 text-white/70">{l?.label || l?.type || 'link'}</a>
                  ))}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {(p.technologies || []).slice(0, 3).map((t: string) => (
                  <span key={t} className="text-[9px] font-mono opacity-40 px-2 py-0.5 border border-white/10 rounded" style={{ color }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )

    case 'skills':
      return (
        <div className="grid grid-cols-2 gap-3">
          {buildDisplaySkills(data.skills || []).map((s: any, idx: number) => (
            <div key={s._id || `skill-${idx}`} className="p-3 ui-context-card flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md border border-white/15 bg-slate-900/70 flex items-center justify-center">
                <SkillIcon title={s?.title || ''} className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-white/80 leading-tight">{s.title}</span>
            </div>
          ))}
        </div>
      )

    case 'work':
      return (
        <div className="space-y-5">
          {groupedWork(data.experience || []).map((companyGroup: any) => (
            <div key={companyGroup.company} className="relative p-4 ui-context-card">
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              <div className="flex gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl border border-white/10 bg-black/40 overflow-hidden shrink-0">
                  {imageUrl(experienceImage({ logo: companyGroup.logo }, data), 160, 160) ? (
                    <img src={imageUrl(experienceImage({ logo: companyGroup.logo }, data), 160, 160)!} alt={companyGroup.company || 'Company visual'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-white/35">LOGO</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-white leading-tight text-base whitespace-normal">{companyGroup.company}</h3>
                </div>
              </div>
              <div className="relative ml-1 pl-5">
                <div className="absolute left-[5px] top-0 bottom-0 w-[2px]" style={{ background: `linear-gradient(180deg, ${hexToRgba(color, 0.8)}, ${hexToRgba(color, 0.2)}, transparent)` }} />
                <div className="space-y-3">
                  {companyGroup.roles.map((exp: any, idx: number) => (
                    <div key={exp._id || `${companyGroup.company}-${idx}`} className="relative p-3 rounded-lg border border-white/10 bg-black/30">
                      <div className="absolute -left-[17px] top-4 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${hexToRgba(color, 0.85)}` }} />
                      <div className="text-[9px] font-mono text-white/40 mb-1">{exp.period}</div>
                      <h4 className="font-black text-white leading-tight text-sm whitespace-normal">{exp.role}</h4>
                      <p className="text-[11px] text-white/35 line-clamp-4 leading-relaxed mt-1.5">{exp.description}</p>
                      {Array.isArray(exp.skills) && exp.skills.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {exp.skills.slice(0, 5).map((s: string) => (
                            <span key={s} className="text-[9px] px-2 py-1 rounded border border-white/10 text-white/60 bg-black/30">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )

    case 'about':
      const site = data.siteSettings || {}
      const aboutText = portableToPlain(site.aboutContent)
      return (
        <div className="space-y-6">
          <div className="aspect-video ui-context-card flex items-center justify-center relative overflow-hidden group">
            {site.aboutPhoto ? (
              <img src={imageUrl(site.aboutPhoto, 800, 450)!} alt="About profile" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-[9px] font-mono text-white/20 tracking-[0.5em] animate-pulse">ESTABLISHING_LINK...</div>
              </>
            )}
          </div>
          <div className="p-6 ui-context-card shadow-inner">
            <p className="text-white/60 text-xs leading-relaxed italic whitespace-pre-line">{aboutText || 'Add About content in Site Settings -> About Me.'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 ui-context-card">
              <div className="text-[8px] font-mono opacity-20 uppercase mb-1 tracking-widest">Availability</div>
              <div className="text-[10px] font-bold text-white uppercase tabular-nums">Q2_2024_ACTIVE</div>
            </div>
            <div className="p-4 ui-context-card">
              <div className="text-[8px] font-mono opacity-20 uppercase mb-1 tracking-widest">Protocol</div>
              <div className="text-[10px] font-bold text-white uppercase tracking-tighter">DIRECT_LINK_V5</div>
            </div>
          </div>
        </div>
      )

    case 'education':
      return (
        <div className="space-y-5">
          {(data.education || []).map((edu: any) => (
            <div key={edu._id} className="p-4 ui-context-card">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-lg border border-white/10 bg-black/40 overflow-hidden shrink-0">
                  {imageUrl(edu.logo, 120, 120) ? (
                    <img src={imageUrl(edu.logo, 120, 120)!} alt={edu.institution || 'Institution logo'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-white/35">EDU</div>
                  )}
                </div>
                <div>
                  <div className="text-[9px] font-mono opacity-40 uppercase mb-1">{edu.period || 'Academic'}</div>
                  <h3 className="text-sm font-bold text-white">{edu.degree}</h3>
                  <div className="text-xs text-white/60 mt-1">{edu.institution}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )

    case 'contact':
      const links = Array.isArray(data?.siteSettings?.contactLinks) ? data.siteSettings.contactLinks : []
      return (
        <div className="space-y-4">
          <div className="p-5 ui-context-card">
            <div className="text-[9px] font-mono uppercase opacity-40 mb-2">Direct Channel</div>
            {links.length > 0 ? (
              <div className="space-y-2">
                {links.slice(0, 6).map((l: any, idx: number) => (
                  <a key={`${l?.url || 'contact'}-${idx}`} href={l?.url || '#'} target="_blank" rel="noreferrer" className="block text-sm text-white/70 underline-offset-4 hover:underline">{l?.label || l?.url}</a>
                ))}
              </div>
            ) : <p className="text-sm text-white/70">Add contact links from Site Settings dashboard.</p>}
          </div>
          <div className="p-5 ui-context-card">
            <div className="text-[9px] font-mono uppercase opacity-40 mb-2">Collaboration</div>
            <p className="text-xs text-white/50">{data?.siteSettings?.contactIntro || 'Open to gameplay systems, tools, and technical art projects.'}</p>
          </div>
          <form onSubmit={submitContact} className="p-5 ui-context-card space-y-2.5">
            <div className="text-[9px] font-mono uppercase opacity-40 mb-2">Send Message</div>
            <input value={contactForm.name} onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" className="w-full h-9 rounded-lg bg-slate-900/70 border border-white/15 px-2.5 text-[11px] text-white outline-none" required />
            <input value={contactForm.email} type="email" onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" className="w-full h-9 rounded-lg bg-slate-900/70 border border-white/15 px-2.5 text-[11px] text-white outline-none" required />
            <input value={contactForm.subject} onChange={(e) => setContactForm((prev) => ({ ...prev, subject: e.target.value }))} placeholder="Subject" className="w-full h-9 rounded-lg bg-slate-900/70 border border-white/15 px-2.5 text-[11px] text-white outline-none" required />
            <textarea value={contactForm.message} onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))} placeholder="Message" className="w-full min-h-24 rounded-lg bg-slate-900/70 border border-white/15 px-2.5 py-2 text-[11px] text-white outline-none" required />
            {contactStatus === 'success' && <div className="text-[10px] text-emerald-300">Message sent.</div>}
            {contactStatus === 'error' && <div className="text-[10px] text-red-300">Send failed. Check recipient email in dashboard.</div>}
            <button type="submit" disabled={contactSending} className="text-[10px] px-3 py-2 rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-60">{contactSending ? 'Sending...' : 'Send'}</button>
          </form>
        </div>
      )

    case 'blog':
      return (
        <div className="space-y-4">
          {(data.blog || []).slice(0, 6).map((post: any) => {
            const bodyText = portableToPlain(post.body)
            const media = Array.isArray(post.media) ? post.media : []
            const formatDate = (d: string) => {
              if (!d) return ''
              try {
                const dt = new Date(d)
                return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
              } catch {
                return d
              }
            }
            const dateStr = formatDate(post.publishedAt)
            const isExpanded = expandedBlogId === post._id

            const expandedMediaWrapper = 'w-full flex justify-center bg-black/20 rounded-lg'
            const expandedMediaImg = 'max-w-full max-h-[70vh] w-auto h-auto object-contain rounded-lg'
            const MediaBlock = ({ item, idx, fullSize }: { item: any; idx: number; fullSize: boolean }) => (
              <div key={`blog-media-${idx}`} className={`rounded-lg border border-white/10 bg-black/30 w-full min-w-0 ${fullSize ? 'overflow-visible' : 'overflow-hidden'}`}>
                {item?.type === 'video' && item?.videoUrl ? (
                  <div className={fullSize ? expandedMediaWrapper : ''}>
                    <video
                      src={item.videoUrl}
                      controls
                      className={fullSize ? expandedMediaImg : 'w-full h-40 object-cover'}
                    />
                  </div>
                ) : item?.image ? (
                  fullSize ? (
                    <div className={expandedMediaWrapper}>
                      <img
                        src={imageUrlNoCrop(item.image, 1600, 2400)!}
                        alt={item?.caption || 'Blog media'}
                        className={expandedMediaImg}
                      />
                    </div>
                  ) : (
                    <img
                      src={imageUrl(item.image, 640, 360)!}
                      alt={item?.caption || 'Blog media'}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  )
                ) : item?.imageUrl ? (
                  fullSize ? (
                    <div className={expandedMediaWrapper}>
                      <img
                        src={item.imageUrl}
                        alt={item?.caption || 'Blog media'}
                        className={expandedMediaImg}
                      />
                    </div>
                  ) : (
                    <img
                      src={item.imageUrl}
                      alt={item?.caption || 'Blog media'}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  )
                ) : null}
                {item?.caption && <div className="text-[10px] text-white/50 p-2">{item.caption}</div>}
              </div>
            )

            return (
              <div
                key={post._id}
                className={`ui-context-card transition-all ${isExpanded ? 'p-4 sm:p-5 overflow-visible' : 'p-4 cursor-pointer hover:border-white/20 active:scale-[0.99] overflow-hidden'}`}
                onClick={() => !isExpanded && setExpandedBlogId(post._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (!isExpanded) setExpandedBlogId(post._id)
                  }
                }}
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-sm font-bold text-white">{post.title}</h3>
                  {isExpanded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedBlogId(null)
                      }}
                      className="text-[10px] px-2 py-1 rounded border border-white/20 text-white/60 hover:text-white hover:bg-white/10 shrink-0"
                    >
                      Collapse
                    </button>
                  )}
                </div>
                {dateStr && <div className="text-[10px] text-white/40 font-mono mt-1">{dateStr}</div>}
                {bodyText && (
                  <p
                    className={`text-xs text-white/60 leading-relaxed whitespace-pre-wrap mt-3 ${!isExpanded ? 'line-clamp-2' : ''}`}
                  >
                    {bodyText}
                  </p>
                )}
                {media.length > 0 && (
                  <div className={`grid gap-2 min-w-0 w-full ${isExpanded ? 'grid-cols-1 mt-5' : 'grid-cols-2 sm:grid-cols-3 mt-3'}`}>
                    {(isExpanded ? media : media.slice(0, 3)).map((item: any, idx: number) => (
                      <MediaBlock key={`blog-media-${idx}`} item={item} idx={idx} fullSize={isExpanded} />
                    ))}
                  </div>
                )}
                {!isExpanded && (bodyText || media.length > 0) && (
                  <div className="text-[9px] text-white/40 mt-2 font-mono">Click to expand</div>
                )}
              </div>
            )
          })}
          {!data.blog?.length && <div className="p-4 ui-context-card text-xs text-white/50">No blog entries synced yet.</div>}
        </div>
      )

    default:
      return (
        <div className="p-12 bg-black/40 border border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center text-center">
          <div className="text-[9px] font-mono opacity-10 mb-6 animate-pulse uppercase tracking-[0.8em]">Encrypted_Sector</div>
          <div className="w-12 h-px bg-white/10 mb-4" />
          <p className="text-[10px] text-white/20 font-mono break-all max-w-[200px]">0x71C94B2510...F8E2</p>
        </div>
      )
  }
}
