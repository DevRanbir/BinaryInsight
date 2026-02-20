"use client"

import { useEffect, useRef } from "react"
import lottie, { type AnimationItem } from "lottie-web"
import codingAnimation from "../../public/Coding.json"

export function PageLoader() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animationRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: codingAnimation,
    })

    return () => {
      animationRef.current?.destroy()
      animationRef.current = null
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div ref={containerRef} className="h-56 w-56" aria-label="Loading" />
    </div>
  )
}
