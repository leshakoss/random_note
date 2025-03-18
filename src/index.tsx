import { ComponentChildren, render } from 'preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { renderAbc } from 'abcjs'
import { Note, ALL_NOTES, FREQ, NOTE_TIMEOUT, TIMEOUT } from './constants'
import { BASS_CLEF_ALL_NOTES } from './inventories'

function getFreq([note, octave]: Note): number {
  const index = ALL_NOTES.indexOf(note)
  return FREQ[index] * Math.pow(2, octave - 2)
}

function randomNewIndex(currentIndex: number, length: number): number {
  const randomIndex = Math.floor(Math.random() * (length - 1))
  return randomIndex >= currentIndex ? randomIndex + 1 : randomIndex
}

const mergeInventories = (...inventories: Note[][]) => {
  let newInventory: Note[] = [...inventories[0]]
  for (const inventory of inventories.slice(1)) {
    for (const note of inventory) {
      if (!newInventory.some((n) => n[0] === note[0] && n[1] === note[1])) {
        newInventory.push(note)
      }
    }
  }
  return newInventory
}

const OCTAVE_SUFFICES = [',,,,', ',,,', ',,', ',', '', '', "'", "''", "'''"]

const getAbcNote = ([note, octave]: Note) => {
  const prefix = note[1] === '#' ? '^' : note[1] === 'b' ? '_' : ''
  const letter = octave > 4 ? note[0] : note[0].toLowerCase()
  const suffix = OCTAVE_SUFFICES[octave] ?? ''

  return `${prefix}${letter}${suffix}`
}

const getAbc = (note: Note) => {
  console.log(getAbcNote(note))
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

  const inventory = useMemo(
    () =>
      mergeInventories(
        // BASS_CLEF
        BASS_CLEF_ALL_NOTES,
        // B_STRING,
        // E_STRING,
        // A_STRING,
        // D_STRING,
        // G_STRING,
      ),
    [],
  )

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

  // console.log(inventory[noteIndex][0])

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
          <NoteComponent isRunning={isRunning} key={noteIndex}>
            {inventory[noteIndex][0]}
          </NoteComponent>
        </div>
      }
    </div>
  )
}

const NoteComponent = ({
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
