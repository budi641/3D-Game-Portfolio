export default {
  name: 'character',
  title: 'Character Config',
  type: 'document',
  fields: [
    { name: 'title', type: 'string', title: 'Config Name' },
    { name: 'walkSpeed', type: 'number', title: 'Movement Velocity (Walk)', initialValue: 5 },
    { name: 'runSpeed', type: 'number', title: 'Movement Velocity (Sprint)', initialValue: 10 },
    { name: 'jumpForce', type: 'number', title: 'Jump Height / Force', initialValue: 5 },
    { name: 'glowIntensity', type: 'number', title: 'Visor Bloom Power', initialValue: 10 }
  ]
}
