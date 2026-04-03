'use client'

import { useEffect } from 'react'
import { initPwaTracking } from '@/lib/gtag'

export function PwaTracker() {
  useEffect(() => {
    initPwaTracking()
  }, [])

  return null
}
