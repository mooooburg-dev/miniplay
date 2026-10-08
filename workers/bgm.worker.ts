// BGM 렌더링 전용 Worker: 곡 합성(곡당 수십~수백 ms)을 메인 스레드 밖에서 처리한다.
import { renderTrack } from '@/lib/bgm-synth'
import { BGM_TRACKS } from '@/lib/bgm-tracks'

export interface BgmRenderRequest {
  id: number
  index: number
  sampleRate: number
}

export interface BgmRenderResponse {
  id: number
  index: number
  left: Float32Array
  right: Float32Array
  sampleRate: number
}

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<BgmRenderRequest>) => void) | null
  postMessage: (message: BgmRenderResponse, transfer: Transferable[]) => void
}

ctx.onmessage = (e) => {
  const { id, index, sampleRate } = e.data
  const { left, right } = renderTrack(BGM_TRACKS[index], sampleRate)
  ctx.postMessage({ id, index, left, right, sampleRate }, [left.buffer, right.buffer])
}
