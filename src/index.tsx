import { render } from 'preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { renderAbc } from 'abcjs'

const INVENTORY = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const FREQ: { [K in (typeof INVENTORY)[number]]: number } = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.0,
  A: 440.0 / 2,
  B: 493.88 / 2,
}
const TIMEOUT = 4000

const getAbc = (note: (typeof INVENTORY)[number]) => {
  return `X:1
L:1/8
K:C bass
%%scale 6
%%staffwidth 250
${note},2`
}
// %%topmargin 300

const App = () => {
  const [isRunning, setIsRunning] = useState(false)

  // Random note
  const [note, setNote] = useState(
    () => INVENTORY[Math.floor(Math.random() * INVENTORY.length)],
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
        setNote((currentNote) => {
          const nextNoteInventory = INVENTORY.filter((n) => n !== currentNote)
          const nextNote =
            nextNoteInventory[
              Math.floor(Math.random() * nextNoteInventory.length)
            ]
          return nextNote
        })
      }, TIMEOUT)
      return () => clearInterval(interval)
    }
  }, [isRunning, setNote])

  const audioContext = useMemo(() => new AudioContext(), [])

  // If the game is running, play the note
  useEffect(() => {
    if (isRunning) {
      const oscillator = audioContext.createOscillator()
      oscillator.connect(audioContext.destination)
      oscillator.frequency.value = FREQ[note]
      oscillator.start()
      return () => oscillator.stop()
    }
  }, [isRunning, note])

  // Ref to abcjs note node
  const abcRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (abcRef.current) {
      renderAbc(abcRef.current, getAbc(note))
      const topLine = abcRef.current.getElementsByClassName('abcjs-top-line')[0]

      const offset =
        topLine.getBoundingClientRect().top -
        abcRef.current.getBoundingClientRect().top

      const staffHeight = topLine.parentElement!.getBoundingClientRect().height

      // Move abcRef to the center of the screen
      abcRef.current.style.marginTop = `${window.innerHeight / 2 - staffHeight / 2 - offset}px`
    }
  }, [note])

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
      {!isRunning && (
        <div
          style={{
            color: 'white',
            fontSize: 100,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            marginBottom: 50,
          }}
        >
          {note}
        </div>
      )}
    </div>
  )
}

render(<App />, document.body)
