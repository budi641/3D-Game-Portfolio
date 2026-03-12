import { useEffect, useMemo, useState } from 'react'
import { set, unset, useClient, useFormValue, type StringInputProps } from 'sanity'
// @ts-expect-error three examples loader has no declaration file in this workspace
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type ClipOption = {
  value: string
  label: string
}

export default function AnimationClipSelectInput(props: StringInputProps) {
  const parentPath = useMemo(() => (Array.isArray(props.path) ? props.path.slice(0, -1) : []), [props.path])

  const modelUrl = useFormValue([...parentPath, 'modelUrl']) as string | undefined
  const statueModelUrl = useFormValue([...parentPath, 'statueModelUrl']) as string | undefined
  const modelFileRef = useFormValue([...parentPath, 'modelFile', 'asset', '_ref']) as string | undefined
  const client = useClient({ apiVersion: '2023-05-03' })

  const [resolvedFileUrl, setResolvedFileUrl] = useState<string | null>(null)
  const [clips, setClips] = useState<ClipOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedUrl = resolvedFileUrl || modelUrl || statueModelUrl || ''

  useEffect(() => {
    let active = true
    if (!modelFileRef) {
      setResolvedFileUrl(null)
      return
    }

    client
      .fetch(`*[_id == $id][0].url`, { id: modelFileRef })
      .then((url) => {
        if (!active) return
        setResolvedFileUrl(typeof url === 'string' ? url : null)
      })
      .catch(() => {
        if (!active) return
        setResolvedFileUrl(null)
      })

    return () => {
      active = false
    }
  }, [client, modelFileRef])

  useEffect(() => {
    let active = true
    if (!resolvedUrl) {
      setClips([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    fetch(resolvedUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch model')
        return res.arrayBuffer()
      })
      .then((buffer) => {
        if (!active) return
        const loader = new GLTFLoader()
        loader.parse(
          buffer,
          '',
          (gltf: any) => {
            if (!active) return
            const parsed = (gltf.animations || []).map((clip: any, i: number) => ({
              value: clip.name || `Clip_${i + 1}`,
              label: clip.name || `Clip ${i + 1}`,
            }))
            setClips(parsed)
            setLoading(false)
          },
          () => {
            if (!active) return
            setLoading(false)
            setClips([])
            setError('Could not parse GLB animation clips.')
          }
        )
      })
      .catch(() => {
        if (!active) return
        setLoading(false)
        setClips([])
        setError('Could not load model URL/file for clip detection.')
      })

    return () => {
      active = false
    }
  }, [resolvedUrl])

  const currentValue = typeof props.value === 'string' ? props.value : ''

  return (
    <div>
      {props.renderDefault(props)}

      {resolvedUrl ? (
        <div style={{ marginTop: 10, padding: 10, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Detected animation clips from model</div>
          {loading ? (
            <div style={{ fontSize: 12, opacity: 0.7 }}>Scanning GLB clips...</div>
          ) : clips.length > 0 ? (
            <select
              value={currentValue}
              onChange={(e) => {
                const value = e.currentTarget.value
                props.onChange(value ? set(value) : unset())
              }}
              style={{
                width: '100%',
                minHeight: 34,
                borderRadius: 6,
                background: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '0 8px',
              }}
            >
              <option value="">No clip selected (falls back to first)</option>
              {clips.map((clip) => (
                <option key={clip.value} value={clip.value}>
                  {clip.label}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.7 }}>No animation clips found in this model.</div>
          )}
          {error ? <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 6 }}>{error}</div> : null}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          Set Model URL or upload Model File first to detect clips.
        </div>
      )}
    </div>
  )
}
