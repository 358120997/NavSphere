'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Github, Menu } from 'lucide-react'
import type { NavigationData } from '@/types/navigation'
import type { SiteConfig } from '@/types/site'
import { Footer } from '@/components/footer'
import { ModeToggle } from '@/components/mode-toggle'
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

  return (
    <div className="flex min-h-screen flex-col bg-muted/10 sm:flex-row">
      <div className="hidden sm:block">
        <Sidebar
          navigationData={navigationData}
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
            'fixed inset-y-0 right-0 w-3/4 max-w-xs transform bg-background shadow-lg transition-transform duration-200 ease-in-out sm:left-0',
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full sm:-translate-x-full'
          )}
        >
          <Sidebar
            navigationData={navigationData}
            siteInfo={siteData}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>

      <main className="flex-1">
        <div className="sticky top-0 z-30 border-b bg-background/85 px-3 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-6">
          <div className="mx-auto flex max-w-[1500px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <SearchBar />
            </div>
            <div className="flex items-center gap-1">
              <ModeToggle />
              <Link
                href="https://github.com/358120997/NavSphere"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="访问 GitHub 仓库"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg hover:bg-accent hover:text-accent-foreground"
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

        <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-8">
          <div className="space-y-9">
            {navigationData.navigationItems.map((category) => (
              <section key={category.id} id={category.id} className="scroll-m-24">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-primary/70" />
                    <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
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
