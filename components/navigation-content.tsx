'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Github, Loader2, Menu, Plus } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import type { NavigationData, NavigationItem, NavigationSubItem } from '@/types/navigation'
import type { SiteConfig } from '@/types/site'
import { Footer } from '@/components/footer'
import { NavigationCard } from '@/components/navigation-card'
import { SearchBar } from '@/components/search-bar'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/registry/new-york/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface NavigationContentProps {
  navigationData: NavigationData
  siteData: SiteConfig
}

export function NavigationContent({ navigationData, siteData }: NavigationContentProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentNavigationData, setCurrentNavigationData] = useState(navigationData)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddUrl, setQuickAddUrl] = useState('')
  const [quickAddMessage, setQuickAddMessage] = useState('')
  const [isQuickAdding, setIsQuickAdding] = useState(false)
  const { data: session, status } = useSession()
  const userName = session?.user?.name || session?.user?.email || (session?.user as any)?.accountId
  const isAdmin = !!(session?.user as any)?.isAdmin

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }

  const addItemToNavigation = (data: NavigationData, item: NavigationSubItem): NavigationData => {
    const navigationItems = [...(data.navigationItems || [])] as NavigationItem[]

    if (navigationItems.length === 0) {
      return {
        navigationItems: [
          {
            id: `category_${Date.now()}`,
            title: '常用推荐',
            enabled: true,
            items: [item],
          },
        ],
      }
    }

    const updatedItems = navigationItems.map((category, index) => {
      if (index !== 0) return category

      if (category.subCategories && category.subCategories.length > 0) {
        const firstSubCategory = category.subCategories[0]
        return {
          ...category,
          subCategories: [
            {
              ...firstSubCategory,
              items: [...(firstSubCategory.items || []), item],
            },
            ...category.subCategories.slice(1),
          ],
        }
      }

      return {
        ...category,
        items: [...(category.items || []), item],
      }
    })

    return { navigationItems: updatedItems }
  }

  const handleQuickAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const url = normalizeUrl(quickAddUrl)

    try {
      new URL(url)
    } catch {
      setQuickAddMessage('请输入有效的网址，例如 example.com')
      return
    }

    setIsQuickAdding(true)
    setQuickAddMessage('')

    try {
      const [navigationResponse, metadataResponse] = await Promise.all([
        fetch('/api/navigation', { cache: 'no-store' }),
        fetch('/api/website-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        }),
      ])

      if (!navigationResponse.ok) {
        throw new Error('读取导航数据失败')
      }

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json().catch(() => null)
        throw new Error(error?.error || '获取网站信息失败')
      }

      const navigation = await navigationResponse.json() as NavigationData
      const metadata = await metadataResponse.json()
      const newItem: NavigationSubItem = {
        id: `site_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        title: metadata.title || new URL(url).hostname,
        href: url,
        description: metadata.description || '',
        icon: metadata.icon || '',
        enabled: true,
      }
      const updatedNavigation = addItemToNavigation(navigation, newItem)
      const saveResponse = await fetch('/api/navigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNavigation),
      })

      if (!saveResponse.ok) {
        const error = await saveResponse.json().catch(() => null)
        throw new Error(error?.details || error?.error || '保存失败')
      }

      setCurrentNavigationData(updatedNavigation)
      setQuickAddUrl('')
      setQuickAddMessage('添加成功，Cloudflare 会自动同步部署。')
    } catch (error) {
      setQuickAddMessage(error instanceof Error ? error.message : '添加失败')
    } finally {
      setIsQuickAdding(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    let isMounted = true

    fetch('/api/home/navigation', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : navigationData))
      .then((data) => {
        if (isMounted) {
          setCurrentNavigationData(data?.navigationItems ? data : navigationData)
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentNavigationData(navigationData)
        }
      })

    return () => {
      isMounted = false
    }
  }, [navigationData, status])

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f3f5] text-foreground/90 dark:bg-[#202326] sm:flex-row">
      <div className="hidden sm:block">
        <Sidebar
          navigationData={currentNavigationData}
          siteInfo={siteData}
          className="sticky top-0 h-screen"
        />
      </div>

      <div
        className={cn(
          'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all sm:hidden',
          isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div
          className={cn(
            'fixed inset-y-0 right-0 w-40 transform bg-[#e9edf1] shadow-lg transition-transform duration-200 ease-in-out dark:bg-[#25282b] sm:left-0',
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full sm:-translate-x-full'
          )}
        >
          <Sidebar
            navigationData={currentNavigationData}
            siteInfo={siteData}
            className="h-full w-full"
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>

      <main className="flex-1">
        <div className="sticky top-0 z-30 bg-[#e9edf1]/95 px-3 py-4 shadow-sm backdrop-blur dark:bg-[#25282b]/95 sm:px-6">
          <div className="mx-auto flex max-w-[1500px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <SearchBar />
            </div>
            <div className="flex items-center gap-1">
              {status === 'authenticated' ? (
                <div className="flex items-center gap-2 rounded-lg bg-white/45 px-2.5 py-1.5 text-sm text-foreground/75 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
                  <span className="hidden max-w-24 truncate sm:inline">{userName}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      className="flex items-center gap-1 font-medium text-foreground/80 transition hover:text-foreground"
                      onClick={() => {
                        setQuickAddMessage('')
                        setIsQuickAddOpen(true)
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">添加</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="font-medium text-foreground/80 transition hover:text-foreground"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Link href="/auth/signin?callbackUrl=/" aria-label="登录">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg px-3 text-foreground/75 hover:bg-black/5 hover:text-foreground"
                    >
                      登录
                    </Button>
                  </Link>
                  <Link href="/auth/register?callbackUrl=/admin" aria-label="注册">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden rounded-lg px-3 text-foreground/75 hover:bg-black/5 hover:text-foreground sm:inline-flex"
                    >
                      注册
                    </Button>
                  </Link>
                </div>
              )}
              <Link
                href="https://github.com/358120997/NavSphere"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="访问 GitHub 仓库"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg text-foreground/70 hover:bg-black/5 hover:text-foreground"
                >
                  <Github className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg sm:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="打开导航菜单"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>快速添加网址</DialogTitle>
              <DialogDescription>
                输入网址后会自动获取标题、描述和图标，并添加到第一个可见分类。
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleQuickAdd} className="space-y-4">
              <Input
                value={quickAddUrl}
                onChange={(event) => {
                  setQuickAddUrl(event.target.value)
                  setQuickAddMessage('')
                }}
                placeholder="example.com"
                disabled={isQuickAdding}
                autoFocus
              />
              {quickAddMessage && (
                <p className={cn(
                  'text-sm',
                  quickAddMessage.includes('成功') ? 'text-emerald-600' : 'text-destructive'
                )}>
                  {quickAddMessage}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsQuickAddOpen(false)}
                  disabled={isQuickAdding}
                >
                  关闭
                </Button>
                <Button type="submit" disabled={isQuickAdding}>
                  {isQuickAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      添加中
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      直接添加
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="mx-auto max-w-[1540px] px-3 py-6 sm:px-6 sm:py-8">
          <div className="space-y-9">
            {currentNavigationData.navigationItems.map((category) => (
              <section key={category.id} id={category.id} className="scroll-m-24">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-foreground/35" />
                    <h2 className="text-base font-semibold tracking-tight text-foreground/85 sm:text-lg">
                      {category.title}
                    </h2>
                  </div>

                  {category.subCategories && category.subCategories.length > 0 ? (
                    category.subCategories.map((subCategory) => (
                      <div key={subCategory.id} id={subCategory.id} className="space-y-3 scroll-m-24">
                        <h3 className="pl-4 text-sm font-medium text-muted-foreground">
                          {subCategory.title}
                        </h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                          {(subCategory.items || []).map((item) => (
                            <NavigationCard key={item.id} item={item} />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {(category.items || []).map((item) => (
                        <NavigationCard key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>

        <Footer siteInfo={siteData} />
      </main>
    </div>
  )
}
