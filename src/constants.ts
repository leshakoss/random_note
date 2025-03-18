export const ALL_NOTES = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
] as const
export const FREQ = [
  261.63, // C
  277.18, // C#
  277.18, // Db
  293.66, // D
  311.13, // D#
  311.13, // Eb
  329.63, // E
  349.23, // F
  369.99, // F#
  369.99, // Gb
  392.0, // G
  415.3, // G#
  415.3, // Ab
  440.0, // A
  466.16, // A#
  466.16, // Bb
  493.88, // B
]

export type Note = [(typeof ALL_NOTES)[number], /** octave */ number]

export const NOTE_TIMEOUT = 1000
export const TIMEOUT = 2000
