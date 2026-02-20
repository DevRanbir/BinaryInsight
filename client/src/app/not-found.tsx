"use client"

import { useEffect, useRef } from "react"
import lottie, { type AnimationItem } from "lottie-web"
import codingAnimation from "../../public/Coding.json"

export default function NotFoundPage() {
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
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1400px] flex-col px-6 py-8">
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      <div className="flex flex-1 items-center justify-center">
        <div ref={containerRef} className="h-64 w-64" aria-label="Not Found Animation" />
      </div>
    </div>
  )
}
