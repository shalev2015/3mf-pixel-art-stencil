import type { SpritePreset } from '@/lib/types';

export const PRESET_SPRITES: Record<string, SpritePreset> = {
  duck: {
    title: 'Duck',
    subtitle: '16×16 · 6 colors',
    code: `let mySprite = sprites.create(img\`
    . . . . . . . . . . b 5 b . . .
    . . . . . . . . . b 5 b . . . .
    . . . . . . b b b b b b . . . .
    . . . . . b b 5 5 5 5 5 b . . .
    . . . . b b 5 d 1 f 5 d 4 c . .
    . . . . b 5 5 1 f f d d 4 4 4 b
    . . . . b 5 5 d f b 4 4 4 4 b .
    . . . b d 5 5 5 5 4 4 4 4 b . .
    . . b d d 5 5 5 5 5 5 5 5 b . .
    . b d d d d 5 5 5 5 5 5 5 5 b .
    b d d d b b b 5 5 5 5 5 5 5 b .
    c d d b 5 5 d c 5 5 5 5 5 5 b .
    c b b d 5 d c d 5 5 5 5 5 5 b .
    . b 5 5 b c d d 5 5 5 5 5 d b .
    b b c c c d d d d 5 5 5 b b . .
    . . . c c c c c c c c b b . . .
\`, SpriteKind.Player)`
  },

  burger: {
    title: 'Burger',
    subtitle: '16×16 · 7 colors',
    code: `let burger = sprites.create(img\`
    . . . . c c c b b b b b . . . .
    . . c c b 4 4 4 4 4 4 b b b . .
    . c b 4 4 4 4 d 4 4 4 4 4 b c .
    . c 4 4 4 4 4 4 4 4 4 4 d 4 c .
    c b 4 4 4 4 4 4 4 4 4 4 4 4 b c
    c b 4 4 4 4 d 4 4 4 4 4 4 4 b c
    c b b 4 4 4 4 4 4 4 4 4 4 b b c
    c c b b b b b b b b b b b b c c
    7 7 7 7 7 7 7 7 7 7 7 7 7 7 7 7
    . 7 7 7 2 2 2 7 7 7 2 2 2 7 7 .
    . c 5 5 5 5 5 5 5 5 5 5 5 5 c .
    c e e e e 5 5 5 e e e e e e e c
    c e e e e e 5 e e e e e e e e c
    . c e e e e e e e e e e e e c .
    . c b 4 4 4 4 4 4 4 4 4 4 b c .
    . . c c c c c c c c c c c c . .
\`, SpriteKind.Food)`
  },

  invader: {
    title: 'Alien',
    subtitle: '16×10 · 3 colors',
    code: `img\`
    . . . 7 7 . . . . . . 7 7 . . .
    . . . . 7 7 . . . . 7 7 . . . .
    . . . 7 7 7 7 7 7 7 7 7 7 . . .
    . . 7 7 1 1 7 7 7 7 1 1 7 7 . .
    . 7 7 7 1 f 7 7 7 7 1 f 7 7 7 .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 7 .
    . 7 . 7 7 7 7 7 7 7 7 7 7 . 7 .
    . 7 . 7 . . . . . . . . 7 . 7 .
    . . . . 7 7 7 . . 7 7 7 . . . .
    . . . 7 7 . . . . . . 7 7 . . .
\``
  },

  heart: {
    title: 'Heart',
    subtitle: '16×15 · 2 colors',
    code: `img\`
    . . . . . . . . . . . . . . . .
    . . 2 2 2 2 . . . . 2 2 2 2 . .
    . 2 2 2 2 2 2 . . 2 2 2 2 2 2 .
    2 2 1 1 2 2 2 2 2 2 2 2 2 2 2 2
    2 2 1 2 2 2 2 2 2 2 2 2 2 2 2 2
    2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2
    2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2
    . 2 2 2 2 2 2 2 2 2 2 2 2 2 2 .
    . . 2 2 2 2 2 2 2 2 2 2 2 2 . .
    . . . 2 2 2 2 2 2 2 2 2 2 . . .
    . . . . 2 2 2 2 2 2 2 2 . . . .
    . . . . . 2 2 2 2 2 2 . . . . .
    . . . . . . 2 2 2 2 . . . . . .
    . . . . . . . 2 2 . . . . . . .
    . . . . . . . . . . . . . . . .
\``
  },

  sword: {
    title: 'Sword',
    subtitle: '16×16 · 4 colors',
    code: `img\`
    . . . . . . . . . . . . . 9 9 9
    . . . . . . . . . . . . 9 9 1 9
    . . . . . . . . . . . 9 9 1 9 9
    . . . . . . . . . . 9 9 1 9 9 .
    . . . . . . . . . 9 9 1 9 9 . .
    . . . . . . . . 9 9 1 9 9 . . .
    . . . 5 5 . . 9 9 1 9 9 . . . .
    . . . 5 5 5 9 9 1 9 9 . . . . .
    . . . . 5 5 5 1 9 9 . . . . . .
    . . . . . 5 5 5 9 . . . . . . .
    . . . . e e 5 5 5 5 . . . . . .
    . . . e e e . 5 5 5 . . . . . .
    . . e e e . . . . . . . . . . .
    . 5 5 e . . . . . . . . . . . .
    . 5 5 . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
\``
  },

  ghost: {
    title: 'Ghost',
    subtitle: '16×14 · 5 colors',
    code: `img\`
    . . . . . 9 9 9 9 9 9 . . . . .
    . . . 9 9 9 1 1 1 1 9 9 9 . . .
    . . 9 9 1 1 1 1 1 1 1 1 9 9 . .
    . 9 9 1 1 f f 1 1 f f 1 1 9 9 .
    . 9 1 1 1 f 8 1 1 f 8 1 1 1 9 .
    . 9 1 1 1 1 1 1 1 1 1 1 1 1 9 .
    9 9 1 1 3 3 1 1 1 1 3 3 1 1 9 9
    9 1 1 1 1 1 1 f f 1 1 1 1 1 1 9
    9 1 1 1 1 1 1 1 1 1 1 1 1 1 1 9
    9 9 1 1 1 1 1 1 1 1 1 1 1 1 9 9
    . 9 9 1 1 1 1 1 1 1 1 1 1 9 9 .
    . 9 9 9 1 1 1 1 1 1 1 1 9 9 9 .
    . 9 9 . 9 9 1 1 1 1 9 9 . 9 9 .
    . 9 . . . 9 9 . . 9 9 . . . 9 .
\``
  },

  cat: {
    title: 'Cat',
    subtitle: '16×15 · 6 colors',
    code: `img\`
    . . e e . . . . . . . . e e . .
    . e 4 4 e . . . . . . e 4 4 e .
    . e 4 3 4 e e e e e e 4 3 4 e .
    . e 4 4 4 4 4 4 4 4 4 4 4 4 e .
    e 4 4 4 4 e 4 4 4 4 e 4 4 4 4 e
    e 4 4 1 f 4 4 4 4 4 4 1 f 4 4 e
    e 4 4 1 f 4 4 4 4 4 4 1 f 4 4 e
    e 4 4 4 4 4 4 3 3 4 4 4 4 4 4 e
    d 4 4 4 4 4 f 4 4 f 4 4 4 4 4 d
    . e d d d d d d d d d d d d e .
    . . e e e d d d d d d e e e . .
    . . . d 4 4 d d d d 4 4 d . . .
    . . . d 4 4 d d d d 4 4 d . . .
    . . . d 4 4 d d d d 4 4 d . . .
    . . . c d d c . . c d d c . . .
\``
  }
};
