'use client'

import { ReactNode, useEffect, useState } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

// This component ensures content is only rendered client-side
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // If we're still on the server, render fallback (or null)
  if (!isClient) {
    return fallback
  }

  // Otherwise, render children normally
  return <>{children}</>
}