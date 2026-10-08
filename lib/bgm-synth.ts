// BGM 합성기: 곡 데이터(BgmTrack)를 반복 재생용 스테레오 PCM으로 렌더링한다.
// 외부 오디오 파일 없이 노트 단위로 직접 샘플을 계산한다.
// AudioContext에 의존하지 않으므로 Web Worker에서도 실행된다 (workers/bgm.worker.ts).

export type LeadWave =
  | 'chip' // 삼각파 + 사각파 (기존 BGM 음색)
  | 'square'
  | 'pulse' // 25% 펄스 (8비트 느낌)
  | 'triangle'
  | 'saw'
  | 'marimba'
  | 'pluck' // 피치카토
  | 'musicbox' // 오르골
export type BassStyle = 'octave' | 'root8' | 'walk' | 'bounce' | 'bossa' | 'pump'
export type ChordStyle = 'pingpong' | 'up16' | 'updown' | 'stab' | 'offbeat' | 'pad' | 'none'
export type DrumKit =
  | 'pop'
  | 'march'
  | 'shuffle'
  | 'bossa'
  | 'chip'
  | 'sneaky'
  | 'driving'
  | 'light'
  | 'tribal'
  | 'disco'

export interface BgmTrack {
  name: string
  bpm: number
  tonic: number // 멜로디 0도의 MIDI 번호 (60 = C4)
  scale: readonly number[] // 반음 간격 (7음)
  /**
   * 멜로디: 마디는 `|`, 8분음표 단위 8칸.
   * 숫자 = 음계 도수(0 = 으뜸음, 7 = 한 옥타브 위, 음수 = 아래), `.` = 쉼표, `-` = 앞 음 연장
   */
  melody: string
  /** 반 마디(2박)마다 코드 근음의 음계 도수 (0 = I, 3 = IV, 4 = V, 5 = vi ...) */
  chords: string
  lead: LeadWave
  bass: BassStyle
  chord: ChordStyle
  drums: DrumKit
  swing?: number // 0~0.35: 뒷박 8분음표를 늦춰 셔플 느낌
  echo?: number // 0~0.4: 점8분음표 에코 양
}

export const MAJOR = [0, 2, 4, 5, 7, 9, 11] as const
export const MINOR = [0, 2, 3, 5, 7, 8, 10] as const
export const MIXOLYDIAN = [0, 2, 4, 5, 7, 9, 10] as const

const TAU = Math.PI * 2

type Wave = LeadWave | 'sine' | 'bass'

interface Note {
  time: number // 초
  dur: number // 초 (release 제외)
  midi: number
  wave: Wave
  vol: number
  pan?: number // -1(왼쪽) ~ 1(오른쪽)
  attack?: number
  decay?: number // 지수 감쇠 속도 (0 = 유지)
  release?: number
  vibrato?: boolean
  lowpass?: number // 0~1, 작을수록 부드러움
}

const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

function oscillate(wave: Wave, phase: number, t: number): number {
  const p = phase - Math.floor(phase)
  switch (wave) {
    case 'sine':
      return Math.sin(p * TAU)
    case 'triangle':
    case 'pluck':
      return 4 * Math.abs(p - 0.5) - 1
    case 'square':
      return p < 0.5 ? 0.8 : -0.8
    case 'pulse':
      return (p < 0.25 ? 1 : -1) + 0.5
    case 'saw':
      return (2 * p - 1) * 0.8
    case 'chip':
      return (4 * Math.abs(p - 0.5) - 1) * 0.7 + (p < 0.5 ? 0.3 : -0.3)
    case 'marimba':
      return Math.sin(p * TAU) + 0.35 * Math.sin(p * 4 * TAU) * Math.exp(-t * 40)
    case 'musicbox':
      return Math.sin(p * TAU) * 0.8 + 0.3 * Math.sin(p * 2 * TAU) + 0.1 * Math.sin(p * 5 * TAU) * Math.exp(-t * 25)
    case 'bass':
      return Math.sin(p * TAU) * 0.8 + (4 * Math.abs(p - 0.5) - 1) * 0.3
  }
}

/** 음색별 기본 엔벨로프 */
const WAVE_SHAPE: Record<LeadWave, Pick<Note, 'attack' | 'decay' | 'release' | 'lowpass' | 'vibrato'>> = {
  chip: { attack: 0.006, decay: 1.5, release: 0.04 },
  square: { attack: 0.005, decay: 1.2, release: 0.05, lowpass: 0.25 },
  pulse: { attack: 0.004, decay: 1, release: 0.03, lowpass: 0.35 },
  triangle: { attack: 0.01, decay: 1.2, release: 0.06 },
  saw: { attack: 0.01, decay: 0.8, release: 0.05, lowpass: 0.18 },
  marimba: { attack: 0.003, decay: 7, release: 0.1 },
  pluck: { attack: 0.003, decay: 11, release: 0.05 },
  musicbox: { attack: 0.003, decay: 3.5, release: 0.3, vibrato: true },
}

const LEAD_VOL: Record<LeadWave, number> = {
  chip: 0.11,
  square: 0.09,
  pulse: 0.06,
  triangle: 0.13,
  saw: 0.1,
  marimba: 0.16,
  pluck: 0.17,
  musicbox: 0.12,
}

/** 드럼 패턴: 16분음표 16칸, x = 강하게, o = 약하게 */
type DrumVoice = 'kick' | 'snare' | 'clap' | 'hat' | 'openHat' | 'shaker' | 'rim' | 'wood' | 'tom'
type DrumPattern = Partial<Record<DrumVoice, string>>

const DRUM_PATTERNS: Record<DrumKit, { main: DrumPattern; fill?: DrumPattern }> = {
  pop: {
    main: { kick: 'x.......x......x', snare: '....x.......x...', hat: 'x...x...x...x...', openHat: '..x...x...x...x.', shaker: 'oooooooooooooooo' },
    fill: { kick: 'x.......x.......', snare: '....x.......xoxx', hat: 'x...x...x.......' },
  },
  march: {
    main: { kick: 'x...x...x...x...', snare: '..o.x.o...o.x.oo', hat: 'x.......x.......' },
    fill: { kick: 'x...x...x.......', snare: '..o.x.o.xoxoxxxx' },
  },
  shuffle: {
    main: { kick: 'x.......x.....x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
    fill: { kick: 'x.......x.......', snare: '....x.......x.xx', hat: 'x.x.x.x.x.x.....' },
  },
  bossa: {
    main: { kick: 'x.....x.x.....x.', rim: 'x..x..x...x..x..', shaker: 'xoooxoooxoooxooo' },
  },
  chip: {
    main: { kick: 'x.....x.x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
    fill: { kick: 'x.....x.x.......', snare: '....x.......xxxx', hat: 'x.x.x.x.x.x.....' },
  },
  sneaky: {
    main: { kick: 'x.........x.....', rim: '....x.......x...', hat: '..o...o...o...o.' },
  },
  driving: {
    main: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xoxoxoxoxoxoxoxo' },
    fill: { kick: 'x...x...x...x...', snare: '....x.....x.xxxx', hat: 'xoxoxoxoxo......' },
  },
  light: {
    main: { kick: 'x.......x.......', shaker: '..x...x...x...x.' },
  },
  tribal: {
    main: { kick: 'x..x..x...x..x..', tom: '........x.x.....', wood: 'x.o..x.ox.o..x.o', shaker: 'oooooooooooooooo' },
    fill: { kick: 'x..x..x.........', tom: '........x.x.xxxx', wood: 'x.o..x.o........' },
  },
  disco: {
    main: { kick: 'x...x...x...x...', clap: '....x.......x...', hat: 'oooooooooooooooo', openHat: '..x...x...x...x.' },
    fill: { kick: 'x...x...x...x...', clap: '....x.......x.xx', openHat: '..x...x...x...x.' },
  },
}

interface Mix {
  L: Float32Array
  R: Float32Array
  sr: number
  len: number
}

/** 루프 경계를 넘는 소리는 버퍼 앞쪽으로 감아 넣어 반복이 끊기지 않게 한다 */
function addSample(mix: Mix, index: number, value: number, pan: number) {
  const i = index % mix.len
  mix.L[i] += value * Math.min(1, 1 - pan)
  mix.R[i] += value * Math.min(1, 1 + pan)
}

function renderNote(mix: Mix, n: Note) {
  const { sr } = mix
  const freq = midiToFreq(n.midi)
  const attack = n.attack ?? 0.01
  const decay = n.decay ?? 0
  const release = n.release ?? 0.05
  const start = Math.round(n.time * sr)
  const total = Math.ceil((n.dur + release) * sr)
  const pan = n.pan ?? 0
  let phase = 0
  let lp = 0
  for (let k = 0; k < total; k++) {
    const t = k / sr
    const f = n.vibrato ? freq * (1 + 0.004 * Math.sin(t * TAU * 5.5)) : freq
    phase += f / sr
    let s = oscillate(n.wave, phase, t)
    if (n.lowpass) {
      lp += n.lowpass * (s - lp)
      s = lp
    }
    let env = t < attack ? t / attack : 1
    if (decay) env *= Math.exp(-t * decay)
    if (t > n.dur) env *= Math.max(0, 1 - (t - n.dur) / release)
    addSample(mix, start + k, s * env * n.vol, pan)
  }
}

function renderDrum(mix: Mix, voice: DrumVoice, time: number, vol: number) {
  const { sr } = mix
  const start = Math.round(time * sr)
  const length: Record<DrumVoice, number> = {
    kick: 0.3, snare: 0.2, clap: 0.22, hat: 0.05, openHat: 0.25, shaker: 0.06, rim: 0.05, wood: 0.12, tom: 0.35,
  }
  const total = Math.ceil(length[voice] * sr)
  let phase = 0
  let prevNoise = 0
  for (let k = 0; k < total; k++) {
    const t = k / sr
    const noise = Math.random() * 2 - 1
    const bright = noise - prevNoise // 간단한 고역 통과 노이즈 (하이햇용)
    prevNoise = noise
    let s = 0
    let pan = 0
    switch (voice) {
      case 'kick': {
        phase += (48 + 110 * Math.exp(-t * 35)) / sr
        s = Math.sin(phase * TAU) * Math.exp(-t * 16) * 0.32
        break
      }
      case 'snare':
        s = noise * Math.exp(-t * 24) * 0.14 + Math.sin(t * 185 * TAU) * Math.exp(-t * 30) * 0.08
        break
      case 'clap': {
        const burst = [0, 0.011, 0.022].reduce((acc, d) => (t >= d ? Math.max(acc, Math.exp(-(t - d) * 70)) : acc), 0)
        s = noise * (burst * 0.7 + Math.exp(-t * 14) * 0.3) * 0.15
        break
      }
      case 'hat':
        s = bright * Math.exp(-t * 90) * 0.045
        pan = 0.3
        break
      case 'openHat':
        s = bright * Math.exp(-t * 14) * 0.035
        pan = 0.3
        break
      case 'shaker':
        s = noise * Math.min(1, t / 0.01) * Math.exp(-t * 45) * 0.03
        pan = -0.35
        break
      case 'rim':
        s = (Math.sin(t * 1650 * TAU) * 0.6 + noise * 0.4) * Math.exp(-t * 95) * 0.11
        pan = -0.2
        break
      case 'wood':
        s = Math.sin(t * 880 * TAU) * Math.exp(-t * 38) * 0.1
        pan = 0.25
        break
      case 'tom': {
        phase += (105 + 70 * Math.exp(-t * 18)) / sr
        s = Math.sin(phase * TAU) * Math.exp(-t * 9) * 0.2
        break
      }
    }
    addSample(mix, start + k, s * vol, pan)
  }
}

function parseTokens(text: string) {
  return text.replace(/\|/g, ' ').trim().split(/\s+/)
}

/** 점8분음표 에코: 원형 버퍼에서 두 바퀴 돌려 루프 경계까지 자연스럽게 이어지게 한다 */
function applyEcho(mix: Mix, delaySec: number, amount: number) {
  const d = Math.round(delaySec * mix.sr)
  const feedback = 0.35
  const wetL = new Float32Array(mix.len)
  const wetR = new Float32Array(mix.len)
  for (let lap = 0; lap < 2; lap++) {
    for (let i = 0; i < mix.len; i++) {
      const j = (i - d + mix.len) % mix.len
      // 좌우를 엇갈려 핑퐁 에코
      wetL[i] = mix.R[j] * amount + wetR[j] * feedback
      wetR[i] = mix.L[j] * amount + wetL[j] * feedback
    }
  }
  for (let i = 0; i < mix.len; i++) {
    mix.L[i] += wetL[i]
    mix.R[i] += wetR[i]
  }
}

/** 곡마다 체감 음량을 맞춘다 (RMS 기준, 클리핑 방지) */
function normalize(mix: Mix) {
  let sum = 0
  let peak = 0
  for (let i = 0; i < mix.len; i++) {
    sum += mix.L[i] * mix.L[i] + mix.R[i] * mix.R[i]
    peak = Math.max(peak, Math.abs(mix.L[i]), Math.abs(mix.R[i]))
  }
  const rms = Math.sqrt(sum / (mix.len * 2))
  if (rms === 0) return
  const gain = Math.min(0.12 / rms, 0.95 / peak)
  for (let i = 0; i < mix.len; i++) {
    mix.L[i] *= gain
    mix.R[i] *= gain
  }
}

export interface RenderedTrack {
  left: Float32Array
  right: Float32Array
  sampleRate: number
}

export function renderTrack(track: BgmTrack, sampleRate: number): RenderedTrack {
  const sr = sampleRate
  const beat = 60 / track.bpm
  const eighth = beat / 2
  const sixteenth = beat / 4
  const swing = track.swing ?? 0

  const melody = parseTokens(track.melody)
  const bars = Math.ceil(melody.length / 8)
  const duration = bars * 4 * beat
  const len = Math.round(duration * sr)
  const mix: Mix = { L: new Float32Array(len), R: new Float32Array(len), sr, len }

  // 16분음표 칸 → 시간 (스윙 적용: 뒷박 8분음표를 늦춘다)
  const stepTime = (step16: number) => step16 * sixteenth + (step16 % 4 === 2 ? swing * eighth : 0)

  const degreeToMidi = (degree: number) => {
    const octave = Math.floor(degree / 7)
    const idx = ((degree % 7) + 7) % 7
    return track.tonic + octave * 12 + track.scale[idx]
  }
  const fitRange = (midi: number, low: number) => {
    let m = midi
    while (m < low) m += 12
    while (m >= low + 12) m -= 12
    return m
  }

  const chordRoots = parseTokens(track.chords).map(Number)
  const chordAt = (step16: number) => chordRoots[Math.floor(step16 / 8) % chordRoots.length]
  const chordTones = (root: number) =>
    [root, root + 2, root + 4].map((d) => fitRange(degreeToMidi(d), 57)).sort((a, b) => a - b)
  const bassNote = (root: number, extra = 0) => fitRange(degreeToMidi(root + extra), 38)

  const totalSteps = bars * 16

  // ── 멜로디 ──
  const shape = WAVE_SHAPE[track.lead]
  melody.forEach((token, i) => {
    const degree = Number(token)
    if (token === '.' || token === '-' || Number.isNaN(degree)) return
    let ties = 0
    while (melody[i + 1 + ties] === '-') ties++
    renderNote(mix, {
      time: stepTime(i * 2),
      dur: (1 + ties) * eighth * 0.92,
      midi: degreeToMidi(degree),
      wave: track.lead,
      vol: LEAD_VOL[track.lead],
      ...shape,
    })
  })

  // ── 베이스 ──
  for (let step = 0; step < totalSteps; step += 2) {
    const root = chordAt(step)
    const inBeat = step % 4 // 0 = 정박, 2 = 뒷박
    const beatInBar = Math.floor(step / 4) % 4
    const t = stepTime(step)
    const bass = (midi: number, dur: number, vol: number, wave: Wave = 'bass') =>
      renderNote(mix, { time: t, dur, midi, wave, vol, attack: 0.008, decay: 2.5, release: 0.05, lowpass: wave === 'bass' ? undefined : 0.12 })
    switch (track.bass) {
      case 'octave':
        if (inBeat === 0) bass(bassNote(root), beat * 0.45, 0.2)
        else bass(bassNote(root) + 12, beat * 0.3, 0.11)
        break
      case 'root8':
        bass(bassNote(root), eighth * 0.75, inBeat === 0 ? 0.13 : 0.09, 'square')
        break
      case 'walk':
        if (inBeat === 0) bass(bassNote(root, [0, 2, 4, 5][beatInBar]), beat * 0.7, 0.19)
        break
      case 'bounce':
        if (inBeat === 0) bass(bassNote(root, beatInBar % 2 === 0 ? 0 : 4), beat * 0.5, 0.2)
        break
      case 'bossa':
        if (inBeat === 0 && beatInBar % 2 === 0) bass(bassNote(root), beat * 1.3, 0.19)
        if (inBeat === 2 && beatInBar % 2 === 1) bass(bassNote(root, 4), eighth * 0.9, 0.15)
        break
      case 'pump':
        if (inBeat === 0) bass(bassNote(root), beat * 0.6, 0.15)
        break
    }
  }

  // ── 화음 / 아르페지오 ──
  for (let step = 0; step < totalSteps; step++) {
    const tones = chordTones(chordAt(step))
    const t = stepTime(step)
    const inBeat = step % 4
    const beatInBar = Math.floor(step / 4) % 4
    switch (track.chord) {
      case 'pingpong': {
        const tone = tones[[0, 1, 2, 0][step % 4]] + 12 // 기존 BGM과 같은 0-1-2-0 패턴
        renderNote(mix, { time: t, dur: sixteenth * 0.6, midi: tone, wave: 'sine', vol: 0.05, attack: 0.003, decay: 6, pan: step % 2 === 0 ? -0.5 : 0.5 })
        break
      }
      case 'up16': {
        const seq = [tones[0], tones[1], tones[2], tones[0] + 12]
        renderNote(mix, { time: t, dur: sixteenth * 0.6, midi: seq[step % 4], wave: 'pulse', vol: 0.025, attack: 0.002, decay: 8, lowpass: 0.3, pan: 0.3 })
        break
      }
      case 'updown': {
        if (step % 2 !== 0) break
        const seq = [tones[0], tones[1], tones[2], tones[0] + 12, tones[2], tones[1]]
        renderNote(mix, { time: t, dur: eighth * 0.9, midi: seq[(step / 2) % 6], wave: 'sine', vol: 0.05, attack: 0.004, decay: 4, release: 0.2, pan: -0.3 })
        break
      }
      case 'stab':
        if (inBeat === 0 && beatInBar % 2 === 1) {
          tones.forEach((m, k) =>
            renderNote(mix, { time: t, dur: eighth * 0.6, midi: m, wave: 'square', vol: 0.025, attack: 0.004, decay: 6, lowpass: 0.15, pan: (k - 1) * 0.4 }),
          )
        }
        break
      case 'offbeat':
        if (inBeat === 2) {
          tones.forEach((m, k) =>
            renderNote(mix, { time: t, dur: eighth * 0.55, midi: m, wave: 'square', vol: 0.022, attack: 0.004, decay: 7, lowpass: 0.15, pan: (k - 1) * 0.4 }),
          )
        }
        break
      case 'pad':
        if (step % 8 === 0) {
          tones.forEach((m, k) =>
            renderNote(mix, { time: t, dur: beat * 1.9, midi: m, wave: 'triangle', vol: 0.03, attack: 0.15, release: 0.25, lowpass: 0.2, pan: (k - 1) * 0.5 }),
          )
        }
        break
      case 'none':
        break
    }
  }

  // ── 드럼 ──
  const { main, fill } = DRUM_PATTERNS[track.drums]
  for (let bar = 0; bar < bars; bar++) {
    const pattern = bar === bars - 1 && fill ? fill : main
    for (const [voice, hits] of Object.entries(pattern) as [DrumVoice, string][]) {
      for (let k = 0; k < 16; k++) {
        const hit = hits[k]
        if (hit !== 'x' && hit !== 'o') continue
        renderDrum(mix, voice, stepTime(bar * 16 + k), hit === 'x' ? 1 : 0.5)
      }
    }
  }

  if (track.echo) applyEcho(mix, eighth * 1.5, track.echo)
  normalize(mix)
  return { left: mix.L, right: mix.R, sampleRate: sr }
}
