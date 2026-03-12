export type CdnModelAsset = {
  id: string
  name: string
  category: 'character' | 'prop' | 'environment'
  hasAnimation: boolean
  license: string
  source: string
  url: string
}

// Curated CDN-backed glTF sample assets (great for fast prototyping).
export const CDN_MODELS: CdnModelAsset[] = [
  {
    id: 'fox',
    name: 'Fox (Animated)',
    category: 'character',
    hasAnimation: true,
    license: 'CC-BY 4.0',
    source: 'Khronos glTF Sample Models',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Fox/glTF-Binary/Fox.glb',
  },
  {
    id: 'robot-expressive',
    name: 'RobotExpressive',
    category: 'character',
    hasAnimation: true,
    license: 'CC-BY 4.0',
    source: 'Khronos glTF Sample Models',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/RobotExpressive/glTF-Binary/RobotExpressive.glb',
  },
  {
    id: 'flight-helmet',
    name: 'Flight Helmet',
    category: 'prop',
    hasAnimation: false,
    license: 'CC-BY 4.0',
    source: 'Khronos glTF Sample Models',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb',
  },
  {
    id: 'damaged-helmet',
    name: 'Damaged Helmet',
    category: 'prop',
    hasAnimation: false,
    license: 'CC-BY 4.0',
    source: 'Khronos glTF Sample Models',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
  },
  {
    id: 'lantern',
    name: 'Lantern',
    category: 'prop',
    hasAnimation: false,
    license: 'CC-BY 4.0',
    source: 'Khronos glTF Sample Models',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Lantern/glTF-Binary/Lantern.glb',
  },
  {
    id: 'boombox',
    name: 'BoomBox',
    category: 'prop',
    hasAnimation: false,
    license: 'CC-BY 4.0',
    source: 'Khronos glTF Sample Models',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
  },
  {
    id: 'avocado',
    name: 'Avocado',
    category: 'prop',
    hasAnimation: false,
    license: 'CC-BY 4.0',
    source: 'Khronos glTF Sample Models',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Avocado/glTF-Binary/Avocado.glb',
  },
  {
    id: 'water-bottle',
    name: 'Water Bottle',
    category: 'prop',
    hasAnimation: false,
    license: 'CC-BY 4.0',
    source: 'Khronos glTF Sample Models',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
  },
  {
    id: 'virtual-city',
    name: 'Virtual City',
    category: 'environment',
    hasAnimation: false,
    license: 'CC-BY 4.0',
    source: 'Khronos glTF Sample Models',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/VirtualCity/glTF-Binary/VirtualCity.glb',
  },
]

export const CDN_ICON_COLLECTIONS = {
  mdi: 'Material Design Icons',
  lucide: 'Lucide',
  ph: 'Phosphor',
  tabler: 'Tabler Icons',
} as const

export function iconifySvgUrl(icon: string, color = '#3b82f6') {
  const encoded = encodeURIComponent(color)
  // Example icon id: "mdi:cube-outline"
  return `https://api.iconify.design/${icon}.svg?color=${encoded}`
}

