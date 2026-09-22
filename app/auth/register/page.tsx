import { Suspense } from 'react'
import RegisterClient from './register-client'

export const runtime = 'edge'

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterClient />
    </Suspense>
  )
}
