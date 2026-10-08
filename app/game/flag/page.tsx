'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { useSpeechRecognition, type SpeechErrorType } from '@/hooks/useSpeechRecognition'
import { TurnBadge } from '@/components/TurnBadge'
import { ScoreBar } from '@/components/ScoreBar'
import { PenaltyOverlay } from '@/components/PenaltyOverlay'
import { trackEvent } from '@/lib/gtag'
import {
  FLAG_LEVELS,
  flagSrc,
  matchCountry,
  shuffle,
  type Country,
  type FlagLevel,
} from '@/lib/flags'

const COLOR = '#0ea5e9'
const SHADOW = '#7dd3fc'
const DARK = '#0369a1'

const QUIZ_LENGTH = 10 // 참여자 없을 때 문제 수
const CHOICE_COUNT = 4
const NEXT_DELAY_CORRECT = 1300 // ms
const NEXT_DELAY_WRONG = 2200 // ms
const PENALTY_DELAY = 1800 // ms

type Phase = 'setup' | 'question' | 'answered' | 'finished'
type AnswerMode = 'touch' | 'voice'

interface Question {
  answer: Country
  choices: Country[]
}

const LEVEL_INFO: Record<FlagLevel, { emoji: string; label: string; desc: string }> = {
  1: { emoji: '🐣', label: '쉬움', desc: '유명한 나라' },
  2: { emoji: '🐥', label: '보통', desc: '조금 어려운 나라' },
  3: { emoji: '🦅', label: '어려움', desc: '어른도 헷갈려요' },
}

const VOICE_ERROR_MSG: Record<SpeechErrorType, string> = {
  'not-allowed': '마이크를 쓸 수 없어요 😢 보기에서 골라주세요',
  unsupported: '이 기기에서는 음성 인식이 안 돼요 😢 보기에서 골라주세요',
  'no-speech': '잘 안 들렸어요. 다시 눌러서 말해줘요!',
  failed: '음성 인식이 잠깐 안 돼요. 다시 말하거나 보기에서 골라주세요',
}

export default function FlagPage() {
  const router = useRouter()
  const { players, scores, turn, nextTurn, addPenalty } = useGameStore()
  const { playClick, playSafe, playDanger, playFanfare } = useAudio()
  const {
    supported: voiceSupported,
    listening,
    interim,
    listen,
    finish: finishListening,
    stop: stopListening,
  } = useSpeechRecognition()

  const [level, setLevel] = useState<FlagLevel>(1)
  const [mode, setMode] = useState<AnswerMode>('touch')
  const [phase, setPhase] = useState<Phase>('setup')
  const [question, setQuestion] = useState<Question | null>(null)
  const [picked, setPicked] = useState<Country | null>(null)
  const [heard, setHeard] = useState('')
  const [voiceMsg, setVoiceMsg] = useState('')
  const [showChoices, setShowChoices] = useState(true)
  const [questionNo, setQuestionNo] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [penaltyPlayer, setPenaltyPlayer] = useState('')

  const hasPlayers = players.length > 0

  // 비동기 콜백(음성 인식, 타이머)에서 최신 값을 읽기 위한 ref
  const phaseRef = useRef<Phase>('setup')
  const questionRef = useRef<Question | null>(null)
  const deckRef = useRef<Country[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 마이크 권한 거부 등으로 음성 인식이 안 되면 이후 문제부터 보기를 바로 보여준다
  const voiceBlockedRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  // 음성 인식을 지원하지 않으면 터치 모드로 고정
  useEffect(() => {
    if (!voiceSupported) setMode('touch')
  }, [voiceSupported])

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  /** 덱에서 다음 국기를 뽑고 보기를 만든다. 덱이 비면 다시 섞는다. */
  const drawQuestion = useCallback((lv: FlagLevel): Question => {
    const pool = FLAG_LEVELS[lv]
    if (deckRef.current.length === 0) {
      const deck = shuffle(pool)
      // 새 덱의 첫 문제가 직전 문제와 같으면 순서를 바꿔 연속 출제 방지
      const prev = questionRef.current?.answer.code
      if (deck.length > 1 && deck[0].code === prev) {
        ;[deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]]
      }
      deckRef.current = deck
    }
    const answer = deckRef.current.shift()!
    const wrongs = shuffle(pool.filter((c) => c.code !== answer.code)).slice(0, CHOICE_COUNT - 1)

    // 다음 국기 미리 불러오기
    const upcoming = deckRef.current[0]
    if (upcoming) new window.Image().src = flagSrc(upcoming.code)

    return { answer, choices: shuffle([answer, ...wrongs]) }
  }, [])

  const goNextQuestion = useCallback(
    (lv: FlagLevel, answerMode: AnswerMode) => {
      const q = drawQuestion(lv)
      questionRef.current = q
      setQuestion(q)
      setPicked(null)
      setHeard('')
      setVoiceMsg('')
      setShowChoices(answerMode === 'touch' || voiceBlockedRef.current)
      setQuestionNo((n) => n + 1)
      changePhase('question')
    },
    [drawQuestion, changePhase],
  )

  const startGame = useCallback(() => {
    trackEvent('game_start', { game_name: 'flag', level, mode })
    playClick()
    clearTimer()
    deckRef.current = []
    questionRef.current = null
    setQuestionNo(0)
    setCorrectCount(0)
    setPenaltyPlayer('')
    goNextQuestion(level, mode)
  }, [level, mode, playClick, clearTimer, goNextQuestion])

  const backToSetup = useCallback(() => {
    clearTimer()
    stopListening()
    setPenaltyPlayer('')
    changePhase('setup')
  }, [clearTimer, stopListening, changePhase])

  const submit = useCallback(
    (choice: Country) => {
      const q = questionRef.current
      if (phaseRef.current !== 'question' || !q) return
      stopListening()
      changePhase('answered')
      setPicked(choice)

      const correct = choice.code === q.answer.code
      if (correct) playSafe()
      else playDanger()

      if (hasPlayers) {
        const playerName = players[turn]
        timerRef.current = setTimeout(() => {
          if (correct) {
            nextTurn()
            goNextQuestion(level, mode)
          } else {
            // 대기 중 참여자 순서가 바뀌었을 수 있어 이름으로 다시 찾는다
            const index = useGameStore.getState().players.indexOf(playerName)
            if (index >= 0) addPenalty(index)
            setPenaltyPlayer(playerName)
          }
        }, correct ? NEXT_DELAY_CORRECT : PENALTY_DELAY)
        return
      }

      if (correct) setCorrectCount((n) => n + 1)
      timerRef.current = setTimeout(() => {
        if (questionNo >= QUIZ_LENGTH) {
          changePhase('finished')
          playFanfare()
        } else {
          goNextQuestion(level, mode)
        }
      }, correct ? NEXT_DELAY_CORRECT : NEXT_DELAY_WRONG)
    },
    [
      hasPlayers, turn, players, level, mode, questionNo,
      stopListening, changePhase, playSafe, playDanger, playFanfare,
      nextTurn, addPenalty, goNextQuestion,
    ],
  )

  // submit은 렌더마다 바뀌므로 음성 인식 콜백에서는 ref로 최신 함수를 호출
  const submitRef = useRef(submit)
  submitRef.current = submit

  const startListening = useCallback(() => {
    if (phaseRef.current !== 'question') return
    playClick()
    setVoiceMsg('')
    setHeard('')
    listen({
      onResult: (transcripts) => {
        const q = questionRef.current
        if (phaseRef.current !== 'question' || !q) return
        // 후보 중 하나라도 정답이면 정답 처리 (아이 발음 배려)
        const correctText = transcripts.find((t) => matchCountry(t)?.code === q.answer.code)
        if (correctText) {
          setHeard(correctText)
          submitRef.current(q.answer)
          return
        }
        const saidText = transcripts.find((t) => matchCountry(t) !== null)
        const said = saidText ? matchCountry(saidText) : null
        setHeard(saidText ?? transcripts[0] ?? '')
        if (said) {
          submitRef.current(said)
        } else {
          setVoiceMsg('나라 이름을 다시 말해줘요!')
        }
      },
      onError: (error) => {
        if (phaseRef.current !== 'question') return
        setVoiceMsg(VOICE_ERROR_MSG[error])
        // 권한 거부·미지원은 계속 실패하므로 이후 문제부터 보기를 바로 보여준다
        if (error === 'not-allowed' || error === 'unsupported') voiceBlockedRef.current = true
        if (error !== 'no-speech') setShowChoices(true)
      },
    })
  }, [listen, playClick])

  const handleRetry = useCallback(() => {
    setPenaltyPlayer('')
    goNextQuestion(level, mode)
  }, [goNextQuestion, level, mode])

  const isAnswered = phase === 'answered'
  // 국기 너비: 한 화면에 맞도록 상태별로 하나만 지정 (같은 요소에 max-w가 겹치면 적용 순서가 불확실)
  // 세로가 낮은 화면(short)은 더 작게, 음성 모드는 마이크·보기 자리만큼 더 줄인다
  const flagWidth =
    mode === 'voice' && showChoices
      ? 'max-w-[min(300px,26dvh)] short:max-w-[150px]'
      : mode === 'voice'
        ? 'max-w-[300px] short:max-w-[190px]'
        : 'max-w-[300px] short:max-w-[210px]'
  const isCorrect = isAnswered && picked?.code === question?.answer.code

  return (
    <>
      <div className="game-screen">
        <button
          onClick={() => router.push('/')}
          className="fixed top-4 left-4 z-50 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base text-gray-400 font-jua shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-90 transition-all hover:bg-white/90"
        >
          ← 홈으로
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-jua text-[#0ea5e9] mb-2">🌍 국기 퀴즈</h1>

        {hasPlayers && phase !== 'setup' && (
          <TurnBadge playerName={players[turn]} color={COLOR} shadowColor={SHADOW} />
        )}
        {hasPlayers && (
          <ScoreBar players={players} scores={scores} currentTurn={turn} activeColor={COLOR} />
        )}

        {/* ── 설정 화면 ── */}
        {phase === 'setup' && (
          <div className="glass-card w-full max-w-sm sm:max-w-md md:max-w-lg p-5 sm:p-7 flex flex-col gap-5">
            <p className="text-center text-sm sm:text-base text-gray-500 font-jua">
              {hasPlayers
                ? '차례대로 국기를 맞혀요. 틀리면 벌칙! 😱'
                : `국기 ${QUIZ_LENGTH}문제! 몇 개나 맞힐 수 있을까? 🤔`}
            </p>

            <section>
              <h2 className="text-base sm:text-lg font-jua text-gray-600 mb-2">레벨</h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {([1, 2, 3] as const).map((lv) => {
                  const info = LEVEL_INFO[lv]
                  const active = level === lv
                  return (
                    <button
                      key={lv}
                      onClick={() => {
                        playClick()
                        setLevel(lv)
                      }}
                      aria-pressed={active}
                      className="rounded-2xl py-3 px-1 font-jua flex flex-col items-center transition-all active:scale-95 border-2"
                      style={
                        active
                          ? { background: COLOR, color: 'white', borderColor: COLOR, boxShadow: `0 4px 0 ${DARK}` }
                          : { background: 'rgba(255,255,255,0.7)', color: '#666', borderColor: 'transparent' }
                      }
                    >
                      <span className="text-3xl sm:text-4xl mb-1">{info.emoji}</span>
                      <span className="text-base sm:text-lg">레벨 {lv}</span>
                      <span className={`text-[11px] sm:text-xs ${active ? 'text-white/85' : 'text-gray-400'}`}>
                        {info.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section>
              <h2 className="text-base sm:text-lg font-jua text-gray-600 mb-2">대답 방법</h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {(
                  [
                    { id: 'touch', emoji: '👆', label: '보기 터치', desc: '4개 중에 골라요' },
                    { id: 'voice', emoji: '🎤', label: '말로 대답', desc: voiceSupported ? '나라 이름을 말해요' : '이 기기는 지원 안 해요' },
                  ] as const
                ).map((opt) => {
                  const active = mode === opt.id
                  const disabled = opt.id === 'voice' && !voiceSupported
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        playClick()
                        setMode(opt.id)
                      }}
                      disabled={disabled}
                      aria-pressed={active}
                      className="rounded-2xl py-3 px-2 font-jua flex flex-col items-center transition-all active:scale-95 border-2 disabled:opacity-40 disabled:active:scale-100"
                      style={
                        active
                          ? { background: COLOR, color: 'white', borderColor: COLOR, boxShadow: `0 4px 0 ${DARK}` }
                          : { background: 'rgba(255,255,255,0.7)', color: '#666', borderColor: 'transparent' }
                      }
                    >
                      <span className="text-3xl mb-1">{opt.emoji}</span>
                      <span className="text-base sm:text-lg">{opt.label}</span>
                      <span className={`text-[11px] sm:text-xs ${active ? 'text-white/85' : 'text-gray-400'}`}>
                        {opt.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            <button
              onClick={startGame}
              className="action-btn self-center px-12 py-4 rounded-full font-jua text-2xl sm:text-3xl text-white active:translate-y-1"
              style={{ background: `linear-gradient(145deg, ${COLOR}, #38bdf8)`, boxShadow: `0 6px 0 ${DARK}` }}
            >
              🚀 시작!
            </button>
          </div>
        )}

        {/* ── 문제 화면 ── */}
        {(phase === 'question' || phase === 'answered') && question && (
          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg wide:max-w-4xl flex flex-col items-center">
            <div className={`flex items-center gap-2 mb-3 short:mb-2 text-sm sm:text-base font-jua text-gray-500 ${hasPlayers ? 'short:hidden' : ''}`}>
              <span className="bg-white/70 rounded-full px-3 py-1">
                {LEVEL_INFO[level].emoji} 레벨 {level}
              </span>
              {!hasPlayers && (
                <>
                  <span className="bg-white/70 rounded-full px-3 py-1">
                    {questionNo} / {QUIZ_LENGTH}
                  </span>
                  <span className="bg-white/70 rounded-full px-3 py-1">⭐ {correctCount}</span>
                </>
              )}
            </div>

            {/* 가로로 넓은 화면(패드 가로 등)은 왼쪽 국기·오른쪽 대답 2단 배치로 한 화면에 맞춘다 */}
            <div className="w-full flex flex-col items-center wide:flex-row wide:justify-center wide:gap-10">
              <div className="w-full flex flex-col items-center wide:w-1/2">
                {/* 국기 */}
                <div
                  className={`relative w-full ${flagWidth} sm:max-w-[360px] md:max-w-[420px] rounded-2xl bg-white p-2.5 sm:p-3 short:p-2 mb-3 short:mb-2 ${
                    isAnswered ? (isCorrect ? 'animate-land-pop' : 'animate-screen-shake') : ''
                  }`}
                  style={{
                    boxShadow: isAnswered
                      ? `0 0 0 4px ${isCorrect ? '#22c55e' : '#ef4444'}, 0 10px 30px rgba(0,0,0,0.12)`
                      : `0 10px 30px ${SHADOW}80`,
                  }}
                >
                  <Image
                    key={question.answer.code}
                    src={flagSrc(question.answer.code)}
                    alt="이 국기는 어느 나라일까요?"
                    width={640}
                    height={480}
                    unoptimized
                    priority
                    draggable={false}
                    className="w-full h-auto rounded-lg ring-1 ring-black/10"
                  />
                </div>

                {/* 결과 / 질문 문구 — 긴 나라 이름도 두 줄 안에 들어가도록 높이를 고정해 화면이 들썩이지 않게 한다 */}
                <div className="h-[4.25rem] sm:h-[4.75rem] short:h-14 flex flex-col items-center justify-center mb-3 short:mb-2 text-center font-jua">
                  {isAnswered ? (
                    <div style={{ color: isCorrect ? '#16a34a' : '#dc2626' }}>
                      <p className="text-base sm:text-lg leading-tight">{isCorrect ? '딩동댕! ⭕' : '땡! ❌ 정답은'}</p>
                      <p className="text-2xl sm:text-3xl leading-tight">{question.answer.name}</p>
                    </div>
                  ) : (
                    <p className="text-xl sm:text-2xl text-[#0ea5e9]">이 국기는 어느 나라일까요?</p>
                  )}
                </div>

              </div>

              <div className="w-full flex flex-col items-center wide:w-1/2 wide:max-w-md">
                {/* 음성 대답 — 보기가 함께 열리면 한 화면에 들어가도록 작은 마이크 + 안내 한 줄로 접는다 */}
                {mode === 'voice' && (
                  <div
                    className={
                      showChoices
                        ? 'flex items-center justify-center gap-3 mb-3 short:mb-2 w-full px-1'
                        : 'flex flex-col items-center mb-4 short:mb-2 w-full'
                    }
                  >
                    <button
                      onClick={listening ? finishListening : startListening}
                      disabled={isAnswered}
                      aria-label={listening ? '다 말했어요' : '눌러서 말하기'}
                      className={`relative shrink-0 rounded-full flex items-center justify-center text-white transition-transform active:scale-95 disabled:opacity-50 ${
                        showChoices
                          ? 'w-12 h-12 text-2xl'
                          : 'w-20 h-20 sm:w-24 sm:h-24 short:w-16 short:h-16 text-4xl sm:text-5xl'
                      }`}
                      style={{
                        background: listening
                          ? 'linear-gradient(145deg, #ef4444, #f87171)'
                          : `linear-gradient(145deg, ${COLOR}, #38bdf8)`,
                        boxShadow: `0 ${showChoices ? 4 : 6}px 0 ${listening ? '#b91c1c' : DARK}`,
                      }}
                    >
                      {listening && (
                        <span className="absolute inset-0 rounded-full bg-red-400/60 animate-ping" />
                      )}
                      <span className="relative">🎤</span>
                    </button>
                    <div className={showChoices ? 'min-w-0 text-left' : 'flex flex-col items-center'}>
                      <p
                        className={`min-h-[1.5rem] text-sm sm:text-base font-jua text-gray-500 ${
                          showChoices ? '' : 'mt-3 short:mt-1.5 text-center px-2'
                        }`}
                      >
                        {listening
                          ? interim
                            ? `"${interim}"`
                            : '듣고 있어요... 다 말하면 마이크를 한 번 더 눌러요'
                          : heard
                            ? `"${heard}"(이)라고 들었어요`
                            : isAnswered
                              ? ''
                              : showChoices
                                ? '말하거나 아래에서 골라요'
                                : '마이크를 누르고 나라 이름을 말해요'}
                      </p>
                      {voiceMsg && (
                        <p
                          className={`text-sm sm:text-base font-jua text-[#ef4444] mt-1 ${showChoices ? '' : 'text-center'} ${isAnswered ? 'invisible' : ''}`}
                        >
                          {voiceMsg}
                        </p>
                      )}
                      {!showChoices && (
                        <button
                          onClick={() => {
                            stopListening()
                            setShowChoices(true)
                          }}
                          disabled={isAnswered}
                          className={`mt-2 text-sm sm:text-base font-jua text-gray-400 underline underline-offset-4 ${isAnswered ? 'invisible' : ''}`}
                        >
                          보기에서 고를래요
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 보기 */}
                {showChoices && (
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
                    {question.choices.map((choice) => {
                      const isAnswer = choice.code === question.answer.code
                      const isPicked = choice.code === picked?.code
                      let style: React.CSSProperties = {
                        background: 'rgba(255,255,255,0.85)',
                        color: '#475569',
                        boxShadow: `0 4px 0 ${SHADOW}`,
                      }
                      if (isAnswered && isAnswer) {
                        style = { background: '#22c55e', color: 'white', boxShadow: '0 4px 0 #15803d' }
                      } else if (isAnswered && isPicked) {
                        style = { background: '#ef4444', color: 'white', boxShadow: '0 4px 0 #b91c1c' }
                      } else if (isAnswered) {
                        style = { ...style, opacity: 0.45 }
                      }
                      return (
                        <button
                          key={choice.code}
                          onClick={() => submit(choice)}
                          disabled={isAnswered}
                          className={`min-h-[3.75rem] sm:min-h-[4.25rem] short:min-h-[3.25rem] rounded-2xl px-2 py-3 short:py-2 font-jua break-keep [overflow-wrap:anywhere] leading-tight transition-all active:translate-y-1 disabled:active:translate-y-0 ${
                            choice.name.length >= 7 ? 'text-base sm:text-lg md:text-xl' : 'text-lg sm:text-xl md:text-2xl'
                          }`}
                          style={style}
                        >
                          {choice.name}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* 답 확인 중에는 숨기되 자리는 유지해 화면이 들썩이지 않게 한다 */}
                <button
                  onClick={backToSetup}
                  disabled={isAnswered}
                  className={`mt-5 short:mt-2 text-sm sm:text-base font-jua text-gray-400 underline underline-offset-4 ${isAnswered ? 'invisible' : ''}`}
                >
                  ⚙️ 레벨 바꾸기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 결과 화면 (참여자 없을 때) ── */}
        {phase === 'finished' && (
          <div className="glass-card w-full max-w-sm sm:max-w-md p-6 sm:p-8 flex flex-col items-center text-center animate-penalty-in">
            <span className="text-7xl sm:text-8xl mb-3">
              {correctCount === QUIZ_LENGTH ? '🏆' : correctCount >= 7 ? '🥳' : correctCount >= 4 ? '😊' : '💪'}
            </span>
            <p className="font-jua text-lg sm:text-xl text-gray-500 mb-1">
              {LEVEL_INFO[level].emoji} 레벨 {level} · {QUIZ_LENGTH}문제 중
            </p>
            <p className="font-jua text-4xl sm:text-5xl text-[#0ea5e9] mb-2">{correctCount}개 정답!</p>
            <p className="font-jua text-base sm:text-lg text-gray-500 mb-6">
              {correctCount === QUIZ_LENGTH
                ? '완벽해요! 국기 박사님 🎓'
                : correctCount >= 7
                  ? '정말 잘했어요!'
                  : correctCount >= 4
                    ? '좋아요! 조금만 더!'
                    : '다시 도전해봐요!'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={startGame}
                className="action-btn px-7 py-3 rounded-full font-jua text-lg sm:text-xl text-white active:translate-y-1"
                style={{ background: `linear-gradient(145deg, ${COLOR}, #38bdf8)`, boxShadow: `0 5px 0 ${DARK}` }}
              >
                🔄 다시 하기
              </button>
              <button
                onClick={backToSetup}
                className="px-7 py-3 rounded-full font-jua text-lg sm:text-xl text-[#0ea5e9] bg-white/80 active:translate-y-1 transition-transform"
                style={{ boxShadow: `0 5px 0 ${SHADOW}` }}
              >
                ⚙️ 레벨 바꾸기
              </button>
            </div>
          </div>
        )}
      </div>

      <PenaltyOverlay isOpen={!!penaltyPlayer} loserName={penaltyPlayer} onRetry={handleRetry} />
    </>
  )
}
