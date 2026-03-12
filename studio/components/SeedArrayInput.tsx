import { useEffect, useRef } from 'react'
import { setIfMissing, type ArrayOfObjectsInputProps } from 'sanity'

type SeededOptions = {
  seedValue?: unknown[]
}

export default function SeedArrayInput(props: ArrayOfObjectsInputProps) {
  const seededRef = useRef(false)
  const options = (props.schemaType?.options || {}) as SeededOptions
  const seedValue = options.seedValue

  useEffect(() => {
    if (seededRef.current) return
    if (!Array.isArray(seedValue) || seedValue.length === 0) return
    if (props.value !== undefined) return
    seededRef.current = true
    props.onChange(setIfMissing(seedValue))
  }, [props, seedValue])

  return props.renderDefault(props)
}

