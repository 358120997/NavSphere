import { Suspense } from 'react'
import SignInClient from './signin-client'

export const runtime = 'edge'

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInClient />
    </Suspense>
  )
}
