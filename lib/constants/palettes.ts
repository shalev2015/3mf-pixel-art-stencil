import type { PaletteEntry, ColorPalette } from '@/lib/types';

export const DEFAULT_PALETTE: PaletteEntry[] = [
  { index: 0, char: '.', hex: '#000000', name: 'Transparent', transparent: true },
  { index: 1, char: '1', hex: '#ffffff', name: 'White' },
  { index: 2, char: '2', hex: '#ff2121', name: 'Red' },
  { index: 3, char: '3', hex: '#ff93c4', name: 'Pink' },
  { index: 4, char: '4', hex: '#ff8135', name: 'Orange' },
  { index: 5, char: '5', hex: '#fff609', name: 'Yellow' },
  { index: 6, char: '6', hex: '#249ca3', name: 'Teal' },
  { index: 7, char: '7', hex: '#78dc52', name: 'Green' },
  { index: 8, char: '8', hex: '#003fad', name: 'Blue' },
  { index: 9, char: '9', hex: '#87f2ff', name: 'Light Blue' },
  { index: 10, char: 'a', hex: '#8e2ec4', name: 'Purple' },
  { index: 11, char: 'b', hex: '#a4839f', name: 'Light Purple' },
  { index: 12, char: 'c', hex: '#5c406c', name: 'Dark Purple' },
  { index: 13, char: 'd', hex: '#e5cdc4', name: 'Tan' },
  { index: 14, char: 'e', hex: '#91463d', name: 'Brown' },
  { index: 15, char: 'f', hex: '#000000', name: 'Black' }
];

export const PRESET_PALETTES: ColorPalette[] = [
  {
    id: 'arcade',
    name: 'Arcade',
    isPreset: true,
    hexes: [
      '#000000',
      '#FFFFFF', '#FF2121', '#FF93C4', '#FF8135', '#FFF609',
      '#249CA3', '#78DC52', '#003FAD', '#87F2FF', '#8E2EC4',
      '#A4839F', '#5C406C', '#E5CDC4', '#91463D', '#000000'
    ]
  },
  {
    id: 'matte',
    name: 'Matte',
    isPreset: true,
    hexes: [
      '#000000',
      '#FFF1E8', '#FF004D', '#FF77A8', '#FFA300', '#FFEC27',
      '#008751', '#00E436', '#29ADFF', '#C2C3C7', '#7E2553',
      '#83769C', '#5F574F', '#FFCCAA', '#AB5236', '#1D2B53'
    ]
  },
  {
    id: 'pastel',
    name: 'Pastel',
    isPreset: true,
    hexes: [
      '#000000',
      '#FFF3D6', '#F76D82', '#FFA3C7', '#F7B582', '#F7E896',
      '#7FC29B', '#AEE68A', '#ABA9E6', '#9DC9E6', '#B2E2DA',
      '#A59BA8', '#755B75', '#FADEC3', '#DB9C81', '#38323B'
    ]
  },
  {
    id: 'sweet',
    name: 'Sweet',
    isPreset: true,
    hexes: [
      '#000000',
      '#F4F4F4', '#B13E53', '#A7F070', '#EF7D57', '#FFCD75',
      '#257179', '#38B764', '#29366F', '#3B5DC9', '#41A6F6',
      '#566C86', '#333C57', '#94B0C2', '#5D275D', '#1A1C2C'
    ]
  },
  {
    id: 'poke',
    name: 'Poke',
    isPreset: true,
    hexes: [
      '#000000',
      '#FFFFFF', '#D45362', '#E8958B', '#CC8945', '#F5DC8C',
      '#417D53', '#5DD48F', '#5162C2', '#6CADEB', '#9A5AC4',
      '#8F3F29', '#612431', '#C0FAC2', '#24325E', '#1B1221'
    ]
  },
  {
    id: 'adventure',
    name: 'Adventure',
    isPreset: true,
    hexes: [
      '#000000',
      '#F5E9B5', '#9E323C', '#C95B63', '#CF7B46', '#BFA93B',
      '#6F8730', '#36637D', '#21444E', '#6EA69E', '#534766',
      '#7A6F82', '#47293D', '#BD856B', '#80503B', '#291A24'
    ]
  },
  {
    id: 'diy',
    name: 'DIY',
    isPreset: true,
    hexes: [
      '#000000',
      '#FFFFFF', '#F80000', '#F888B8', '#F8A830', '#F8F858',
      '#089050', '#70D038', '#2868C0', '#10C0C8', '#C868E8',
      '#C0C0C0', '#787878', '#F8D898', '#C04800', '#000000'
    ]
  },
  {
    id: 'adafruit',
    name: 'Adafruit',
    isPreset: true,
    hexes: [
      '#000000',
      '#FFFFFF', '#FF0000', '#FF007D', '#FF7A00', '#E5FF00',
      '#2D9F00', '#00FF72', '#0034FF', '#17ABFF', '#C600FF',
      '#636363', '#7400DB', '#00EFFF', '#DF2929', '#000000'
    ]
  },
  {
    id: 'still-life',
    name: 'Still Life',
    isPreset: true,
    hexes: [
      '#000000',
      '#A8E4D4', '#D13B27', '#E07F8A', '#CC8218', '#B3E868',
      '#5D853A', '#68C127', '#286FB8', '#9B8BFF', '#3F2811',
      '#513155', '#122615', '#C7B581', '#7A2222', '#000000'
    ]
  },
  {
    id: 'steam-punk',
    name: 'Steam Punk',
    isPreset: true,
    hexes: [
      '#000000',
      '#A0B9BA', '#603B3A', '#170E19', '#775C4F', '#77744F',
      '#3A604A', '#4F7754', '#433A60', '#4F5277', '#213B25',
      '#2F213B', '#65738C', '#7C94A1', '#3B2137', '#291D2B'
    ]
  },
  {
    id: 'grayscale',
    name: 'Grayscale',
    isPreset: true,
    hexes: [
      '#000000',
      '#FFFFFF', '#EDEDED', '#DBDBDB', '#C8C8C8', '#B6B6B6',
      '#A4A4A4', '#929292', '#808080', '#6D6D6D', '#5B5B5B',
      '#494949', '#373737', '#242424', '#121212', '#000000'
    ]
  }
];
