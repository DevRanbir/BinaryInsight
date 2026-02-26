"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { PageLoader } from "@/components/PageLoader"

export function GlobalRouteLoader() {
  const pathname = usePathname()
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    const duration = 3000
    setShowLoader(true)

    const timeout = window.setTimeout(() => {
      setShowLoader(false)
    }, duration)

    return () => window.clearTimeout(timeout)
  }, [pathname])

  if (!showLoader) return null
  return <PageLoader />
}
