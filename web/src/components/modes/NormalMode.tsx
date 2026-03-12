import { Play, BriefcaseBusiness, FolderKanban, GraduationCap, Newspaper, Sparkles, UserRound } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../store/appStore'
import { usePortfolioData } from '../../hooks/usePortfolioData'
import { urlFor } from '../../lib/sanity'
import { CDN_MODELS, iconifySvgUrl } from '../../lib/cdnAssets'

function experienceVisual(job: any, fallbackProject: any) {
  return job?.logo || job?.image || job?.mainImage || job?.companyImage || fallbackProject?.mainImage || null
}

const NormalMode = () => {
  const { setMode } = useAppStore()
  const { data, loading } = usePortfolioData()
  const fallbackProject = data?.projects?.[0]
  const sections = [
    { id: 'projects', label: 'Projects' },
    { id: 'work', label: 'Work' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'blog', label: 'Blog' },
  ]
  const topProjects = (data?.projects || []).slice(0, 6)
  const skillCategories = [...new Set((data?.skills || []).map((s: any) => s.category).filter((v: unknown) => typeof v === 'string'))] as string[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative">
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

      <header className="relative overflow-hidden rounded-3xl border border-engine-border bg-engine-panel/70 backdrop-blur-xl p-6 sm:p-8 mb-8 ui-card-3d">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute inset-0 ui-aurora opacity-60 pointer-events-none" />
        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-slate-900/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-sky-200/80 mb-3">
                <Sparkles size={12} />
                Portfolio Experience Mode
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.05]"
              >
                CINEMATIC PORTFOLIO COMMAND CENTER
              </motion.h1>
              <p className="text-engine-text-muted mt-3 max-w-3xl text-sm sm:text-base">
                Scroll through rich project stories, production timelines, skills, education, and dev updates. Every block is content-driven from your dashboard with motion-first UI.
              </p>
            </div>

            <button
              onClick={() => setMode('game')}
              className="rounded-full px-6 py-3 font-bold text-white bg-emerald-500 hover:bg-emerald-400 border border-emerald-300/40 shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 inline-flex items-center justify-center"
            >
              <Play size={16} fill="currentColor" />
              <span className="font-bold ml-2">PLAY</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="engine-panel rounded-2xl p-4 border border-sky-200/15"
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-engine-text-muted">Projects</div>
              <div className="text-2xl font-black text-white mt-2">{data?.projects?.length || 0}</div>
            </motion.h1>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="engine-panel rounded-2xl p-4 border border-sky-200/15">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-engine-text-muted">Experience</div>
              <div className="text-2xl font-black text-white mt-2">{data?.experience?.length || 0}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="engine-panel rounded-2xl p-4 border border-sky-200/15">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-engine-text-muted">Skills</div>
              <div className="text-2xl font-black text-white mt-2">{data?.skills?.length || 0}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="engine-panel rounded-2xl p-4 border border-sky-200/15">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-engine-text-muted">Articles</div>
              <div className="text-2xl font-black text-white mt-2">{data?.blog?.length || 0}</div>
            </motion.div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="text-[11px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-sky-200/20 bg-slate-900/40 text-engine-text-muted hover:text-white hover:border-sky-300/45 transition-colors">
                {section.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="space-y-12 relative z-[1]">
        <section id="projects" className="space-y-6">
          <div className="flex items-center gap-3">
            <FolderKanban className="text-sky-300" size={20} />
            <h2 className="text-2xl font-black tracking-wide text-engine-text">Featured Projects</h2>
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
                  className={`engine-panel p-4 rounded-2xl group hover:border-engine-accent transition-all duration-300 ui-card-3d ${idx === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}
                >
                  <div className="w-full aspect-video bg-engine-bg mb-4 overflow-hidden rounded-xl border border-white/10 relative">
                    {project.mainImage ? (
                      <img
                        src={urlFor(project.mainImage).width(900).height(506).fit('crop').auto('format').url()}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-engine-text-muted text-xs font-mono uppercase opacity-35">
                        NO MEDIA
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                    {idx === 0 && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold tracking-[0.16em] bg-sky-400/20 border border-sky-300/40 text-sky-100">
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {(data?.experience || []).map((job: any, idx: number) => (
              <motion.article
                key={job._id}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -14 : 14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="engine-panel rounded-2xl overflow-hidden ui-card-3d border border-sky-200/15"
              >
                <div className="p-5 border-b border-white/10 bg-slate-900/40">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/15 bg-black/40 shrink-0">
                      {experienceVisual(job, fallbackProject) ? (
                        <img
                          src={urlFor(experienceVisual(job, fallbackProject)).width(120).height(120).fit('crop').auto('format').url()}
                          alt={job.company || 'Company visual'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-white/40">LOGO</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-white truncate">{job.role}</h3>
                      <div className="text-sm text-engine-text-muted truncate">{job.company}</div>
                      <div className="text-[11px] font-mono text-sky-300/80 mt-1">{job.period}</div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-engine-text-muted leading-relaxed">{job.description}</p>
                  {Array.isArray(job.skills) && job.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.skills.slice(0, 8).map((skill: string) => (
                        <span key={skill} className="text-[11px] px-2.5 py-1 rounded-md border border-white/15 bg-black/30 text-engine-text-muted">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="skills" className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-sky-300" size={20} />
            <h2 className="text-2xl font-black tracking-wide text-engine-text">Skills Matrix</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {skillCategories.map((cat: string, idx: number) => (
              <motion.article
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                className="engine-panel rounded-2xl p-5 border border-sky-200/15 ui-card-3d"
              >
                <div className="text-[10px] uppercase tracking-[0.22em] text-sky-200/70 font-mono mb-4">{cat}</div>
                <div className="space-y-2.5">
                  {(data?.skills || [])
                    .filter((s: any) => s.category === cat)
                    .slice(0, 8)
                    .map((skill: any) => (
                      <div key={skill._id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white font-semibold">{skill.title}</span>
                          <span className="text-[10px] font-mono text-white/50">{skill.level || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-400" style={{ width: `${Math.max(0, Math.min(100, skill.level || 0))}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="education" className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <article className="engine-panel rounded-2xl p-6 border border-sky-200/15 ui-card-3d space-y-5">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-sky-300" size={20} />
              <h2 className="text-2xl font-black tracking-wide text-engine-text">Education</h2>
            </div>
            <div className="space-y-3">
              {(data?.education || []).map((edu: any) => (
                <div key={edu._id} className="p-4 rounded-xl border border-white/10 bg-black/30">
                  <div className="text-[10px] font-mono text-white/45 mb-1">{edu.period || 'Academic timeline'}</div>
                  <div className="font-bold text-white">{edu.degree}</div>
                  <div className="text-sm text-engine-text-muted">{edu.institution}</div>
                </div>
              ))}
              {!data?.education?.length && <div className="text-sm text-engine-text-muted">No education entries yet.</div>}
            </div>
          </article>

          <article id="blog" className="engine-panel rounded-2xl p-6 border border-sky-200/15 ui-card-3d space-y-5">
            <div className="flex items-center gap-3">
              <Newspaper className="text-sky-300" size={20} />
              <h2 className="text-2xl font-black tracking-wide text-engine-text">Blog & Notes</h2>
            </div>
            <div className="space-y-3">
              {(data?.blog || []).slice(0, 5).map((post: any) => (
                <div key={post._id} className="p-4 rounded-xl border border-white/10 bg-black/30">
                  <div className="font-bold text-white text-sm mb-1">{post.title}</div>
                  <div className="text-[10px] font-mono text-white/45">{post.publishedAt || 'Draft'}</div>
                </div>
              ))}
              {!data?.blog?.length && <div className="text-sm text-engine-text-muted">No blog entries synced yet.</div>}
            </div>
          </article>
        </section>

        <section className="engine-panel rounded-2xl p-6 sm:p-8 border border-sky-200/15 ui-card-3d relative overflow-hidden">
          <div className="absolute inset-0 ui-aurora opacity-35 pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-sky-200/80 text-[10px] uppercase tracking-[0.22em] font-mono mb-2">
                <UserRound size={14} />
                Contact & Collaboration
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Build something memorable together.</h3>
              <p className="text-engine-text-muted mt-2 max-w-2xl text-sm sm:text-base">
                Open for gameplay systems, tools, technical art, and interactive web experiences.
              </p>
            </div>
            <button onClick={() => setMode('game')} className="engine-button bg-sky-500/20 border-sky-300/40 hover:bg-sky-400/30">
              <Play size={16} />
              Jump Back In-World
            </button>
          </div>
        </section>

        <section id="cdn-library" className="space-y-6">
          <h2 className="text-2xl font-black tracking-wide text-engine-text">CDN Asset Library</h2>
          <div className="engine-panel p-6 space-y-4 rounded-2xl ui-card-3d border border-sky-200/15">
            <h3 className="text-sm font-bold uppercase tracking-wider text-engine-text/90">
              3D Models & Animations
            </h3>
            <div className="space-y-2">
              {CDN_MODELS.map((asset) => (
                <div key={asset.id} className="text-xs text-engine-text-muted font-mono break-all">
                  <span className="text-engine-accent mr-2">[{asset.name}]</span>
                  {asset.url}
                </div>
              ))}
            </div>
          </div>

          <div className="engine-panel p-6 space-y-4 rounded-2xl ui-card-3d border border-sky-200/15">
            <h3 className="text-sm font-bold uppercase tracking-wider text-engine-text/90">
              Iconify CDN Icons
            </h3>
            <div className="flex flex-wrap gap-6 items-center">
              {['mdi:cube-outline', 'lucide:gamepad-2', 'ph:planet-bold', 'tabler:bolt'].map((icon) => (
                <div key={icon} className="flex items-center gap-3">
                  <img src={iconifySvgUrl(icon, '#38bdf8')} alt={icon} className="w-6 h-6" />
                  <span className="text-xs font-mono text-engine-text-muted">{icon}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 pt-8 border-t border-engine-border flex flex-col md:flex-row justify-between text-xs text-engine-text-muted font-mono gap-2">
        <div>© 2026 GAME DEVELOPER PORTFOLIO</div>
        <div>BUILT WITH REACT THREE FIBER + SANITY</div>
      </footer>
    </div>
  )
}

export default NormalMode
