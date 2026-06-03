'use client'

import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Icons } from '@/components/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') || '/admin'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await signIn('credentials', {
      username,
      password,
      callbackUrl,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      setError('用户名或密码不正确')
      return
    }

    router.push(result?.url || callbackUrl)
    router.refresh()
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-md">
              <img src="/assets/images/alogo.png" alt="Logo" className="object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold leading-none tracking-tight text-white">
                NavSphere
              </span>
            </div>
          </div>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              管理你的导航站点、资源和页面配置。
            </p>
            <footer className="text-sm">NavSphere Admin</footer>
          </blockquote>
        </div>
      </div>

      <div className="lg:p-8">
        <div className="mx-auto flex h-full w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-2xl">
                登录管理后台
              </CardTitle>
              <CardDescription className="text-center">
                使用本地管理员账号登录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    disabled={isLoading}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    '登录'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
