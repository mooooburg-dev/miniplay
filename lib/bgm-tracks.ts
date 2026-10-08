// BGM 곡 목록 (8마디 루프). 합성 방식과 표기법은 lib/bgm-synth.ts 참고.
import { MAJOR, MINOR, MIXOLYDIAN, type BgmTrack } from '@/lib/bgm-synth'

export const BGM_TRACKS: BgmTrack[] = [
  {
    // 기존 BGM
    name: '두근두근 팝',
    bpm: 160,
    tonic: 60, // C
    scale: MAJOR,
    melody:
      '7 9 11 9 8 7 8 9 | 4 5 6 7 8 9 8 7 | 9 . 11 9 8 . 7 8 | 9 8 7 6 5 4 5 . | ' +
      '7 8 9 11 9 8 7 9 | 4 . 6 . 8 . 11 . | 9 11 9 8 7 8 9 11 | 8 7 6 5 4 . . .',
    chords: '0 0 5 5 3 3 4 4 0 0 5 5 3 4 0 0',
    lead: 'chip',
    bass: 'octave',
    chord: 'pingpong',
    drums: 'pop',
  },
  {
    name: '장난감 행진',
    bpm: 128,
    tonic: 65, // F
    scale: MAJOR,
    melody:
      '0 - 2 - 4 - 4 - | 5 4 3 2 4 - . . | 1 - 3 - 5 - 5 - | 6 5 4 3 5 - . . | ' +
      '7 - 7 6 5 - 4 - | 3 4 5 3 4 - 2 - | 0 2 4 7 6 4 5 6 | 7 - 4 - 7 - . .',
    chords: '0 0 3 0 1 1 4 4 0 5 3 4 0 4 0 0',
    lead: 'square',
    bass: 'bounce',
    chord: 'stab',
    drums: 'march',
  },
  {
    name: '통통 셔플',
    bpm: 112,
    tonic: 67, // G
    scale: MAJOR,
    swing: 0.3,
    melody:
      '0 2 4 2 0 . 4 . | 5 4 2 4 0 - . . | 3 2 3 5 4 - 2 - | 1 . 1 2 1 0 -1 . | ' +
      '0 2 4 7 6 4 5 . | 3 5 7 5 4 2 0 . | 1 3 5 3 4 2 1 -1 | 0 - 4 2 0 - . .',
    chords: '0 0 5 0 3 0 4 4 0 0 3 0 1 4 0 0',
    lead: 'triangle',
    bass: 'walk',
    chord: 'offbeat',
    drums: 'shuffle',
  },
  {
    name: '해변 보사노바',
    bpm: 118,
    tonic: 62, // D
    scale: MAJOR,
    echo: 0.22,
    melody:
      '4 . 4 2 - 4 . 7 | 6 - - 4 . . . . | 3 . 3 1 - 3 . 6 | 5 - - 4 . . . . | ' +
      '2 . 2 0 - 2 . 4 | 3 - 2 - 1 - 0 - | 1 . 3 . 5 4 - 1 | 0 - - - . . . .',
    chords: '0 0 4 4 1 1 4 4 0 5 3 3 1 4 0 0',
    lead: 'marimba',
    bass: 'bossa',
    chord: 'pad',
    drums: 'bossa',
  },
  {
    name: '8비트 모험',
    bpm: 150,
    tonic: 69, // A 단조
    scale: MINOR,
    melody:
      '0 . 0 2 4 . 2 0 | -1 . -1 1 3 . 1 -1 | -2 . -2 0 2 . 0 -2 | -3 -1 1 2 1 -1 -3 . | ' +
      '4 - 3 2 4 - 7 - | 6 5 4 2 3 - 1 - | 2 3 4 5 4 3 2 1 | 0 - 4 - 0 - . .',
    chords: '0 0 6 6 5 5 4 4 0 0 6 6 5 4 0 0',
    lead: 'pulse',
    bass: 'root8',
    chord: 'up16',
    drums: 'chip',
  },
  {
    name: '살금살금 탐정',
    bpm: 100,
    tonic: 62, // D 단조
    scale: MINOR,
    swing: 0.12,
    melody:
      '0 . 2 . 0 . -1 . | -2 . -1 . 0 . . . | 0 . 2 . 4 . 3 . | 2 1 0 . -3 . . . | ' +
      '4 . 4 3 2 . 3 . | 4 . 5 . 4 . 2 . | 0 1 2 3 4 3 2 1 | 0 . -3 . 0 . . .',
    chords: '0 0 5 6 0 0 0 4 0 3 4 4 0 4 0 0',
    lead: 'pluck',
    bass: 'walk',
    chord: 'none',
    drums: 'sneaky',
  },
  {
    name: '달려라 레이스',
    bpm: 172,
    tonic: 64, // E
    scale: MAJOR,
    melody:
      '4 4 4 2 4 . 7 . | 6 5 4 5 4 2 0 . | 3 3 3 1 3 . 5 . | 4 3 2 3 4 - . . | ' +
      '7 7 6 5 4 . 2 . | 3 . 5 . 7 . 5 . | 4 6 8 6 4 6 8 9 | 7 - 7 . 7 . . .',
    chords: '0 0 4 0 3 3 4 4 0 5 3 3 4 4 0 0',
    lead: 'saw',
    bass: 'octave',
    chord: 'up16',
    drums: 'driving',
  },
  {
    name: '꿈나라 오르골',
    bpm: 92,
    tonic: 70, // B♭
    scale: MAJOR,
    echo: 0.3,
    melody:
      '0 - 2 - 4 - 7 - | 6 - 5 - 4 - - - | 3 - 5 - 7 - 9 - | 8 - 7 - 4 - - - | ' +
      '5 - 4 - 2 - 4 - | 3 - 2 - 1 - 3 - | 2 4 7 4 2 4 6 4 | 0 - - - . . . .',
    chords: '0 0 4 4 3 3 4 4 5 0 3 4 0 4 0 0',
    lead: 'musicbox',
    bass: 'pump',
    chord: 'updown',
    drums: 'light',
  },
  {
    name: '정글 탐험',
    bpm: 120,
    tonic: 67, // G 믹솔리디안
    scale: MIXOLYDIAN,
    melody:
      '0 . 2 4 . 2 0 . | 6 . 6 8 . 6 4 . | 0 . 2 4 . 2 0 . | 3 2 1 0 -1 . 0 . | ' +
      '4 4 . 4 6 4 2 . | 3 3 . 3 4 3 1 . | 6 . 4 . 2 . 1 . | 0 - . 0 0 - . .',
    chords: '0 0 6 4 0 0 3 3 0 0 3 3 6 4 0 0',
    lead: 'marimba',
    bass: 'bounce',
    chord: 'stab',
    drums: 'tribal',
  },
  {
    name: '신나는 디스코',
    bpm: 124,
    tonic: 69, // A
    scale: MAJOR,
    melody:
      '0 . 0 . 2 4 . 2 | 3 . 2 . 0 . . . | -2 . -2 . 0 2 . 0 | 1 . 0 . -3 . . . | ' +
      '4 4 . 4 5 4 2 0 | 3 3 . 3 4 3 1 -1 | 0 2 4 7 4 2 0 2 | 1 . 0 . . . . .',
    chords: '0 0 3 0 5 5 4 4 0 0 3 4 0 0 4 0',
    lead: 'square',
    bass: 'octave',
    chord: 'offbeat',
    drums: 'disco',
  },
]
