
'use client'
import { useState, useEffect } from 'react'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return <>{isClient ? children : null}</>
}
