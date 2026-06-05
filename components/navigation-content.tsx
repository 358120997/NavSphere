'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Github, Menu } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import type { NavigationData } from '@/types/navigation'
import type { SiteConfig } from '@/types/site'
import { Footer } from '@/components/footer'
import { NavigationCard } from '@/components/navigation-card'
import { SearchBar } from '@/components/search-bar'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/registry/new-york/ui/button'
import { cn } from '@/lib/utils'

interface NavigationContentProps {
  navigationData: NavigationData
  siteData: SiteConfig
}

export function NavigationContent({ navigationData, siteData }: NavigationContentProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentNavigationData, setCurrentNavigationData] = useState(navigationData)
  const { data: session, status } = useSession()
  const userName = session?.user?.name || session?.user?.email || (session?.user as any)?.accountId

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
