import { useMemo, useState, type FormEvent } from 'react'
import { Play, BriefcaseBusiness, FolderKanban, GraduationCap, Sparkles, UserRound, X, ExternalLink, Linkedin, Github, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../store/appStore'
import { usePortfolioData } from '../../hooks/usePortfolioData'
import { urlFor } from '../../lib/sanity'
import { buildDisplaySkills, SkillIcon } from '../../lib/skillsDisplay'

function experienceVisual(job: any, fallbackProject: any) {
  return job?.logo || job?.image || job?.mainImage || job?.companyImage || fallbackProject?.mainImage || null
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

function projectThumb(project: any): string | null {
  const media = Array.isArray(project?.media) ? project.media : []
  const imageFromMedia = media.find((m: any) => m?.type === 'image' && m?.image)?.image
  if (imageFromMedia) {
    try {
      return urlFor(imageFromMedia).width(900).height(506).fit('crop').auto('format').url()
    } catch {
      return null
    }
  }
  if (project?.mainImage) {
    try {
      return urlFor(project.mainImage).width(900).height(506).fit('crop').auto('format').url()
    } catch {
      return null
    }
  }
  return typeof project?.mainImageUrl === 'string' ? project.mainImageUrl : null
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
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
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

function resolveRelicLinks(scene: any) {
  const defaults = [
    { id: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com' },
    { id: 'github', label: 'GitHub', url: 'https://github.com' },
    { id: 'resume', label: 'Resume', url: '/resume' },
  ]
  const rel = scene?.linkRelics || {}
  return defaults.map((base) => {
    const match = rel[base.id] || (base.id === 'resume' ? rel.itch : null) || null
    return {
      ...base,
      label: match?.label || base.label,
      url: match?.url || base.url,
    }
  })
}

const NormalMode = () => {
  const { setMode } = useAppStore()
  const { data, loading } = usePortfolioData()
  const fallbackProject = data?.projects?.[0]
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const site = data?.siteSettings || {}
  const aboutText = portableToPlain(site.aboutContent)
  const contactRecipient = site.contactRecipientEmail || ''
  const contactLinks = Array.isArray(site.contactLinks) ? site.contactLinks : []
  const sections = [
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'work', label: 'Work' },
    { id: 'projects', label: 'Projects' },
    { id: 'contact', label: 'Contact' },
  ]
  const topProjects = (data?.projects || []).slice(0, 12)
  const workGroups = useMemo(() => groupedWork(data?.experience || []), [data?.experience])
  const displaySkills = useMemo(() => buildDisplaySkills(data?.skills || []), [data?.skills])
  const relicLinks = useMemo(() => resolveRelicLinks(data?.scene), [data?.scene])
  const linkedInLink = relicLinks.find((r) => r.id === 'linkedin')
  const githubLink = relicLinks.find((r) => r.id === 'github')
  const resumeLink = relicLinks.find((r) => r.id === 'resume')

  const submitContact = async (e: FormEvent) => {
    e.preventDefault()
    if (!contactRecipient) {
      setStatus('error')
      return
    }
    setSending(true)
    setStatus('idle')
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(contactRecipient)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('send failed')
      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setStatus('error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="w-full relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-90">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-10 -left-10 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 -right-16 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 relative z-[1]">

      <header className="relative overflow-hidden rounded-3xl border border-engine-border bg-engine-panel/70 backdrop-blur-xl p-6 sm:p-8 mb-8 ui-card-3d">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute inset-0 ui-aurora opacity-60 pointer-events-none" />
        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.05]"
              >
                {site.title || 'CINEMATIC PORTFOLIO COMMAND CENTER'}
              </motion.h1>
              <p className="text-engine-text-muted mt-3 max-w-3xl text-sm sm:text-base">
                {site.description || 'Scroll through rich project stories, production timelines, skills, education, and dev updates. Every block is content-driven from your dashboard with motion-first UI.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => setMode('game')}
                className="rounded-full px-6 py-3 font-bold text-white bg-emerald-500 hover:bg-emerald-400 border border-emerald-300/40 shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 inline-flex items-center justify-center shrink-0"
              >
                <Play size={16} fill="currentColor" />
                <span className="font-bold ml-2">PLAY</span>
              </button>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="text-[11px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-sky-200/20 bg-slate-900/40 text-engine-text-muted hover:text-white hover:border-sky-300/45 transition-colors">
                {section.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-wrap gap-2.5">
            <a href={linkedInLink?.url || '#'} target="_blank" rel="noreferrer" className="engine-button text-xs">
              <Linkedin size={14} />
              LinkedIn
            </a>
            <a href={githubLink?.url || '#'} target="_blank" rel="noreferrer" className="engine-button text-xs">
              <Github size={14} />
              GitHub
            </a>
            <a href={resumeLink?.url || '#'} target="_blank" rel="noreferrer" className="engine-button text-xs">
              <FileText size={14} />
              Resume
            </a>
          </div>
        </div>
      </header>

      <main className="space-y-12 relative z-[1]">
        <section id="about" className="space-y-6">
          <div className="flex items-center gap-3">
            <UserRound className="text-sky-300" size={20} />
            <h2 className="text-2xl font-black tracking-wide text-engine-text">About Me</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <article className="engine-panel rounded-2xl p-5 border border-sky-200/15 ui-card-3d">
              <div className="aspect-square rounded-2xl overflow-hidden border border-white/15 bg-black/40">
                {site.aboutPhoto ? (
                  <img src={urlFor(site.aboutPhoto).width(720).height(720).fit('crop').auto('format').url()} alt="About profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-xs font-mono">ABOUT PHOTO</div>
                )}
              </div>
            </article>
            <article className="engine-panel rounded-2xl p-6 border border-sky-200/15 ui-card-3d">
              <h3 className="text-xl font-black text-white mb-3">{site.aboutHeadline || 'My Journey'}</h3>
              <p className="text-sm text-engine-text-muted whitespace-pre-line leading-relaxed">
                {aboutText || 'Add your About content from the dashboard (Site Settings -> About Me).'}
              </p>
              {Array.isArray(site.aboutHighlights) && site.aboutHighlights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  {site.aboutHighlights.map((item: any, idx: number) => (
                    <div key={`${item?.title || 'hl'}-${idx}`} className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <div className="text-sm font-bold text-white">{item?.title || 'Highlight'}</div>
                      <div className="text-xs text-engine-text-muted mt-1">{item?.description || ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
        </section>

        <section id="projects" className="space-y-6">
          <div className="flex items-center gap-3">
            <FolderKanban className="text-sky-300" size={20} />
            <h2 className="text-2xl font-black tracking-wide text-engine-text">Project Library</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-25 animate-pulse">
              {[1, 2, 3, 4].map((i) => <div key={i} className="engine-panel h-72 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {topProjects.map((project: any, idx: number) => (
                <motion.article
                  key={project._id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: idx * 0.04 }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  onClick={() => setSelectedProject(project)}
                  className={`engine-panel p-4 rounded-2xl group hover:border-engine-accent transition-all duration-300 ui-card-3d cursor-pointer ${
                    project?.featured ? 'border-2 border-amber-300/80 shadow-[0_0_25px_rgba(245,158,11,0.28)]' : ''
                  }`}
                >
                  <div className="w-full aspect-video bg-engine-bg mb-4 overflow-hidden rounded-xl border border-white/10 relative">
                    {projectThumb(project) ? (
                      <img
                        src={projectThumb(project)!}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-engine-text-muted text-xs font-mono uppercase opacity-35">
                        NO MEDIA
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                    {project?.featured && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold tracking-[0.16em] bg-amber-500/20 border border-amber-300/70 text-amber-100">
                        FEATURED
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black mb-2 group-hover:text-engine-accent transition-colors">{project.title}</h3>
                  <p className="text-sm text-engine-text-muted line-clamp-3">{project.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(project.technologies || []).slice(0, 5).map((tech: string) => (
                      <span key={tech} className="text-[10px] px-2 py-1 rounded-md border border-white/10 bg-black/30 text-white/70">
                        {tech}
                      </span>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        <section id="work" className="space-y-6">
          <div className="flex items-center gap-3">
            <BriefcaseBusiness className="text-sky-300" size={20} />
            <h2 className="text-2xl font-black tracking-wide text-engine-text">Work Experience</h2>
          </div>
          <div className="space-y-6">
            {workGroups.map((companyGroup: any, idx: number) => (
              <motion.article
                key={companyGroup.company}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.04 }}
                className="engine-panel rounded-2xl overflow-hidden ui-card-3d border border-sky-200/15 p-5 sm:p-6"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/15 bg-black/40 shrink-0">
                    {experienceVisual({ logo: companyGroup.logo }, fallbackProject) ? (
                      <img
                        src={urlFor(experienceVisual({ logo: companyGroup.logo }, fallbackProject)).width(128).height(128).fit('crop').auto('format').url()}
                        alt={companyGroup.company || 'Company visual'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-white/40">LOGO</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-black bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-transparent">{companyGroup.company}</h3>
                  </div>
                </div>

                <div className="relative ml-1 pl-6">
                  <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-sky-300/60 via-violet-300/40 to-transparent" />
                  <div className="space-y-5">
                    {companyGroup.roles.map((job: any, roleIndex: number) => (
                      <div key={job._id || `${companyGroup.company}-${roleIndex}`} className="relative rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="absolute -left-[23px] top-5 w-3.5 h-3.5 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.8)]" />
                        <h4 className="text-lg font-black text-white">{job.role}</h4>
                        <div className="text-sm text-engine-text-muted mt-0.5">{job.period}</div>
                        <p className="text-sm text-engine-text-muted leading-relaxed mt-2">{job.description}</p>
                        {Array.isArray(job.skills) && job.skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {job.skills.slice(0, 8).map((skill: string) => (
                              <span key={skill} className="text-[11px] px-2.5 py-1 rounded-md border border-white/15 bg-black/30 text-engine-text-muted">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="skills" className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-sky-300" size={20} />
            <h2 className="text-2xl font-black tracking-wide text-engine-text">Skills</h2>
          </div>
          <div className="engine-panel rounded-2xl p-5 border border-sky-200/15 ui-card-3d">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {displaySkills.map((skill: any, idx: number) => (
                <motion.div
                  key={skill._id || `skill-${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.3, delay: Math.min(0.02 * idx, 0.24) }}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 rounded-lg border border-white/15 bg-slate-900/60 flex items-center justify-center text-sky-300 shrink-0">
                    <SkillIcon title={skill?.title || ''} className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-white font-semibold leading-tight">{skill.title}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="education" className="space-y-6">
          <article className="engine-panel rounded-2xl p-6 border border-sky-200/15 ui-card-3d space-y-5">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-sky-300" size={20} />
              <h2 className="text-2xl font-black tracking-wide text-engine-text">Education</h2>
            </div>
            <div className="space-y-3">
              {(data?.education || []).map((edu: any) => (
                <div key={edu._id} className="p-4 rounded-xl border border-white/10 bg-black/30">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-lg border border-white/10 bg-black/40 overflow-hidden shrink-0">
                      {edu?.logo ? (
                        <img
                          src={urlFor(edu.logo).width(120).height(120).fit('crop').auto('format').url()}
                          alt={edu.institution || 'Institution visual'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-white/35">EDU</div>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-white/45 mb-1">{edu.period || 'Academic timeline'}</div>
                      <div className="font-bold text-white">{edu.degree}</div>
                      <div className="text-sm text-engine-text-muted">{edu.institution}</div>
                    </div>
                  </div>
                </div>
              ))}
              {!data?.education?.length && <div className="text-sm text-engine-text-muted">No education entries yet.</div>}
            </div>
          </article>
        </section>

        <section id="contact" className="engine-panel rounded-2xl p-6 sm:p-8 border border-sky-200/15 ui-card-3d relative overflow-hidden">
          <div className="absolute inset-0 ui-aurora opacity-35 pointer-events-none" />
          <div className="relative grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-sky-200/80 text-[10px] uppercase tracking-[0.22em] font-mono mb-2">
                <UserRound size={14} />
                Contact & Collaboration
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Build something memorable together.</h3>
              <p className="text-engine-text-muted mt-2 max-w-2xl text-sm sm:text-base">
                {site.contactIntro || 'Open for gameplay systems, tools, technical art, and interactive web experiences.'}
              </p>
              <div className="mt-4 space-y-2">
                {contactLinks.map((link: any, idx: number) => (
                  <a key={`${link?.label || 'contact'}-${idx}`} href={link?.url || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-black/25 hover:border-sky-300/40 transition-colors">
                    <span className="text-sm text-white">{link?.label || 'Contact Link'}</span>
                    <ExternalLink size={14} className="text-sky-300" />
                  </a>
                ))}
              </div>
              <p className="text-[11px] text-engine-text-muted mt-3">
                Form recipient: {contactRecipient || 'Set in dashboard Site Settings -> Contact'}
              </p>
            </div>
            <form onSubmit={submitContact} className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
                className="w-full h-11 rounded-xl bg-slate-900/60 border border-white/15 px-3 text-sm text-white outline-none focus:border-sky-300/60"
                required
              />
              <input
                value={form.email}
                type="email"
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="w-full h-11 rounded-xl bg-slate-900/60 border border-white/15 px-3 text-sm text-white outline-none focus:border-sky-300/60"
                required
              />
              <input
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Subject"
                className="w-full h-11 rounded-xl bg-slate-900/60 border border-white/15 px-3 text-sm text-white outline-none focus:border-sky-300/60"
                required
              />
              <textarea
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Message"
                className="w-full min-h-32 rounded-xl bg-slate-900/60 border border-white/15 px-3 py-2 text-sm text-white outline-none focus:border-sky-300/60"
                required
              />
              {status === 'success' && <div className="text-xs text-emerald-300">Message sent successfully.</div>}
              {status === 'error' && <div className="text-xs text-red-300">Failed to send. Check recipient email in dashboard.</div>}
              <div className="flex gap-2">
                <button type="submit" disabled={sending} className="engine-button bg-sky-500/20 border-sky-300/40 hover:bg-sky-400/30 disabled:opacity-60">
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
                <button type="button" onClick={() => setMode('game')} className="engine-button">
                  <Play size={16} />
                  PLAY
                </button>
              </div>
            </form>
          </div>
        </section>

        {selectedProject && (
          <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
            <div className="w-full max-w-5xl max-h-[88vh] overflow-auto rounded-2xl border border-sky-300/30 bg-slate-950/95 p-5 relative custom-scrollbar">
              <button onClick={() => setSelectedProject(null)} className="absolute top-4 right-4 w-9 h-9 rounded-lg border border-white/15 bg-black/40 text-white/80 flex items-center justify-center hover:bg-black/60">
                <X size={16} />
              </button>
              <h3 className="text-2xl font-black text-white mb-3 pr-10">{selectedProject.title}</h3>
              <p className="text-sm text-engine-text-muted mb-4">{selectedProject.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {(Array.isArray(selectedProject.media) ? selectedProject.media : []).slice(0, 8).map((item: any, idx: number) => (
                  <div key={`pm-${idx}`} className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                    {item?.type === 'video' && item?.videoUrl ? (
                      <video src={item.videoUrl} controls className="w-full h-56 object-cover" />
                    ) : item?.image ? (
                      <img src={urlFor(item.image).width(960).height(540).fit('crop').auto('format').url()} alt={item?.caption || 'Project media'} className="w-full h-56 object-cover" />
                    ) : item?.imageUrl ? (
                      <img src={item.imageUrl} alt={item?.caption || 'Project media'} className="w-full h-56 object-cover" />
                    ) : null}
                    {item?.caption && <div className="text-xs text-engine-text-muted p-2">{item.caption}</div>}
                  </div>
                ))}
              </div>
              {Array.isArray(selectedProject.links) &&
                selectedProject.links
                  .map((l: any) => youtubeEmbedUrl(l?.url || ''))
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((embed: any, idx: number) => (
                    <div key={`yt-${idx}`} className="mb-4 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                      <iframe
                        src={embed}
                        title={`project-youtube-${idx}`}
                        className="w-full aspect-video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  ))}
              <div className="flex flex-wrap gap-2 mb-4">
                {(selectedProject.technologies || []).map((t: string) => (
                  <span key={t} className="text-[11px] px-2 py-1 rounded border border-white/10 text-white/70 bg-black/30">{t}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(selectedProject.links || []).map((link: any, idx: number) => (
                  <a key={`pl-${idx}`} href={link?.url || '#'} target="_blank" rel="noreferrer" className="engine-button text-xs">
                    {link?.label || link?.type || 'Link'}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {(site?.footerPrimaryText || site?.footerSecondaryText) && (
        <footer className="mt-20 pt-8 border-t border-engine-border flex flex-col md:flex-row justify-between text-xs text-engine-text-muted font-mono gap-2">
          <div>{site?.footerPrimaryText || ''}</div>
          <div>{site?.footerSecondaryText || ''}</div>
        </footer>
      )}
      </div>
    </div>
  )
}

export default NormalMode
