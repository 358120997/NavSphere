import { Suspense } from 'react'
import ErrorClient from './error-client'

export const runtime = 'edge'

export default function ErrorPage() {
  return (
    <Suspense fallback={null}>
      <ErrorClient />
    </Suspense>
  )
}
