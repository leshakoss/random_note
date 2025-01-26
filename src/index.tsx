import { ComponentChildren, render } from 'preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { renderAbc } from 'abcjs'

const ALL_NOTES = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const
const FREQ = [
  261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.0, 415.3, 440.0,
  466.16, 493.88,
]

type Note = [(typeof ALL_NOTES)[number], /** octave */ number]

function getFreq([note, octave]: Note): number {
  const index = ALL_NOTES.indexOf(note)
  return FREQ[index] * Math.pow(2, octave - 4)
}

function randomNewIndex(currentIndex: number, length: number): number {
  const randomIndex = Math.floor(Math.random() * (length - 1))
  return randomIndex >= currentIndex ? randomIndex + 1 : randomIndex
}

const NOTE_TIMEOUT = 2000
const TIMEOUT = 3000

const eStringInventory: Note[] = [
  ['E', 2],
  ['F', 2],
  ['G', 2],
  ['A', 2],
  ['B', 2],
  ['C', 3],
  ['D', 3],
]

const OCTAVE_SUFFICES = [
  ',,,,,',
  ',,,,',
  ',,,',
  ',,',
  ',',
  '',
  '',
  "'",
  "''",
  "'''",
]

const getAbcNote = ([note, octave]: Note) => {
  return `${octave > 4 ? note : note.toLowerCase()}${
    OCTAVE_SUFFICES[octave] ?? ''
  }`
}

const getAbc = (note: Note) => {
  return `X:1
L:1/8
K:C bass
%%scale 6
%%staffwidth 250
${getAbcNote(note)}2
  `
}

const App = () => {
  const [isRunning, setIsRunning] = useState(false)

  const inventory = useMemo(() => eStringInventory, [])

  // Random note
  const [noteIndex, setNoteIndex] = useState<number>(() =>
    Math.floor(Math.random() * inventory.length),
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        setIsRunning((isRunning) => !isRunning)
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setIsRunning])

  // If the game is running, generate a new note every ${TIMEOUT} ms
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setNoteIndex((currentNoteIndex) =>
          randomNewIndex(currentNoteIndex, inventory.length),
        )
      }, TIMEOUT)
      return () => clearInterval(interval)
    }
  }, [isRunning, setNoteIndex])

  const audioContext = useMemo(() => new AudioContext(), [])

  // If the game is running, play the note
  useEffect(() => {
    if (isRunning) {
      const oscillator = audioContext.createOscillator()
      oscillator.connect(audioContext.destination)
      oscillator.frequency.value = getFreq(inventory[noteIndex])
      oscillator.start()
      return () => oscillator.stop()
    }
  }, [isRunning, noteIndex])

  // Ref to abcjs note node
  const abcRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (abcRef.current) {
      renderAbc(abcRef.current, getAbc(inventory[noteIndex]))

      // Align everything
      const topLine = abcRef.current.getElementsByClassName('abcjs-top-line')[0]

      const offset =
        topLine.getBoundingClientRect().top -
        abcRef.current.getBoundingClientRect().top

      const staffHeight = topLine.parentElement!.getBoundingClientRect().height

      // Move abcRef to the center of the screen
      abcRef.current.style.marginTop = `${window.innerHeight / 2 - staffHeight / 2 - offset}px`
    }
  }, [noteIndex])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: isRunning ? 'black' : 'brown',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between', // 'center',
      }}
    >
      <div
        style={{
          color: 'white',
        }}
      >
        <div ref={abcRef} />
      </div>
      {
        <div
          style={{
            color: 'white',
            fontSize: 100,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            marginBottom: 50,
          }}
        >
          <Note isRunning={isRunning} key={noteIndex}>
            {inventory[noteIndex][0]}
          </Note>
        </div>
      }
    </div>
  )
}

const Note = ({
  isRunning,
  children,
}: {
  isRunning: boolean
  children: ComponentChildren
}) => {
  const [shouldDisplay, setShouldDisplay] = useState(false)
  useEffect(() => {
    if (!isRunning) {
      setShouldDisplay(true)
    }
  }, [isRunning])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShouldDisplay(true)
    }, NOTE_TIMEOUT)

    return () => clearTimeout(timeout)
  }, [])

  return <>{shouldDisplay ? children : null}</>
}

render(<App />, document.body)
