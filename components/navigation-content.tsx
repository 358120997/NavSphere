'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Github, Loader2, Menu, Plus, RefreshCw } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import type { NavigationData, NavigationItem, NavigationSubItem } from '@/types/navigation'
import type { SiteConfig } from '@/types/site'
import { Footer } from '@/components/footer'
import { NavigationCard } from '@/components/navigation-card'
import { SearchBar } from '@/components/search-bar'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/registry/new-york/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/new-york/ui/select'
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

interface QuickAddSite {
  url: string
  title: string
  description: string
  icon: string
  categoryId: string
  subCategoryId: string
}

const emptyQuickAddSite: QuickAddSite = {
  url: '',
  title: '',
  description: '',
  icon: '',
  categoryId: '',
  subCategoryId: '',
}

export function NavigationContent({ navigationData, siteData }: NavigationContentProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentNavigationData, setCurrentNavigationData] = useState(navigationData)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddSite, setQuickAddSite] = useState<QuickAddSite>(emptyQuickAddSite)
  const [quickAddMessage, setQuickAddMessage] = useState('')
  const [isQuickAdding, setIsQuickAdding] = useState(false)
  const [isFetchingQuickMetadata, setIsFetchingQuickMetadata] = useState(false)
  const [lastFetchedQuickUrl, setLastFetchedQuickUrl] = useState('')
  const { data: session, status } = useSession()
  const userName = session?.user?.name || session?.user?.email || (session?.user as any)?.accountId
  const isAdmin = !!(session?.user as any)?.isAdmin
  const selectedQuickCategory = currentNavigationData.navigationItems.find(
    (category) => category.id === quickAddSite.categoryId
  )

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }

  const getDefaultQuickCategoryId = (data: NavigationData) => data.navigationItems?.[0]?.id || ''

  const addItemToNavigation = (
    data: NavigationData,
    item: NavigationSubItem,
    categoryId: string,
    subCategoryId: string
  ): NavigationData => {
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

    const updatedItems = navigationItems.map((category) => {
      if (category.id !== categoryId) return category

      if (subCategoryId && category.subCategories && category.subCategories.length > 0) {
        return {
          ...category,
          subCategories: category.subCategories.map((subCategory) => (
            subCategory.id === subCategoryId
              ? {
                  ...subCategory,
                  items: [...(subCategory.items || []), item],
                }
              : subCategory
          )),
        }
      }

      return {
        ...category,
        items: [...(category.items || []), item],
      }
    })

    return { navigationItems: updatedItems }
  }

  const fetchQuickMetadata = async (forceUpdate = false) => {
    const url = normalizeUrl(quickAddSite.url)

    try {
      new URL(url)
    } catch {
      setQuickAddMessage('请输入有效的网址，例如 example.com')
      return
    }

    if (!forceUpdate && lastFetchedQuickUrl === url) {
      return
    }

    setIsFetchingQuickMetadata(true)
    setQuickAddMessage('正在识别网站信息...')

    try {
      const response = await fetch('/api/website-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || '获取网站信息失败')
      }

      const metadata = await response.json()
      setQuickAddSite((site) => ({
        ...site,
        url,
        title: forceUpdate || !site.title ? metadata.title || new URL(url).hostname : site.title,
        description: forceUpdate || !site.description ? metadata.description || '' : site.description,
        icon: (forceUpdate || !site.icon) && metadata.icon ? metadata.icon : site.icon,
      }))
      setLastFetchedQuickUrl(url)
      setQuickAddMessage('已识别网站信息')
    } catch (error) {
      setQuickAddMessage(error instanceof Error ? error.message : '识别失败')
    } finally {
      setIsFetchingQuickMetadata(false)
    }
  }

  const handleQuickAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const url = normalizeUrl(quickAddSite.url)

    try {
      new URL(url)
    } catch {
      setQuickAddMessage('请输入有效的网址，例如 example.com')
      return
    }

    if (!quickAddSite.categoryId) {
      setQuickAddMessage('请选择分类')
      return
    }

    setIsQuickAdding(true)
    setQuickAddMessage('')

    try {
      const navigationResponse = await fetch('/api/navigation', { cache: 'no-store' })

      if (!navigationResponse.ok) {
        throw new Error('读取导航数据失败')
      }

      const navigation = await navigationResponse.json() as NavigationData
      let title = quickAddSite.title
      let description = quickAddSite.description
      let icon = quickAddSite.icon

      if (!title || !description || !icon) {
        const metadataResponse = await fetch('/api/website-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        })

        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json()
          title = title || metadata.title || new URL(url).hostname
          description = description || metadata.description || ''
          icon = icon || metadata.icon || ''
        }
      }

      const newItem: NavigationSubItem = {
        id: `site_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        title: title || new URL(url).hostname,
        href: url,
        description,
        icon,
        enabled: true,
      }
      const updatedNavigation = addItemToNavigation(
        navigation,
        newItem,
        quickAddSite.categoryId,
        quickAddSite.subCategoryId
      )
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
      setQuickAddSite({
        ...emptyQuickAddSite,
        categoryId: quickAddSite.categoryId,
        subCategoryId: quickAddSite.subCategoryId,
      })
      setLastFetchedQuickUrl('')
      setQuickAddMessage('添加成功，Cloudflare 会自动同步部署。')
    } catch (error) {
      setQuickAddMessage(error instanceof Error ? error.message : '添加失败')
    } finally {
      setIsQuickAdding(false)
    }
  }

  useEffect(() => {
    if (!isQuickAddOpen) {
      return
    }

    setQuickAddSite((site) => ({
      ...site,
      categoryId: site.categoryId || getDefaultQuickCategoryId(currentNavigationData),
    }))
  }, [currentNavigationData, isQuickAddOpen])

  useEffect(() => {
    if (!isQuickAddOpen || isQuickAdding || isFetchingQuickMetadata) {
      return
    }

    const url = normalizeUrl(quickAddSite.url)
    if (!quickAddSite.url.includes('.') || lastFetchedQuickUrl === url) {
      return
    }

    try {
      new URL(url)
    } catch {
      return
    }

    const timer = window.setTimeout(() => {
      fetchQuickMetadata(false)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [isFetchingQuickMetadata, isQuickAddOpen, isQuickAdding, lastFetchedQuickUrl, quickAddSite.url])

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
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>快速添加网址</DialogTitle>
              <DialogDescription>
                输入网址后自动识别网站信息，选择分类后直接添加到前台导航。
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleQuickAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quick-url">网址 *</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="quick-url"
                      value={quickAddSite.url}
                      onChange={(event) => {
                        setQuickAddSite((site) => ({ ...site, url: event.target.value }))
                        setQuickAddMessage('')
                      }}
                      onBlur={() => {
                        if (quickAddSite.url.trim()) {
                          fetchQuickMetadata(false)
                        }
                      }}
                      placeholder="example.com"
                      disabled={isQuickAdding}
                      autoFocus
                    />
                    {isFetchingQuickMetadata && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!quickAddSite.url || isFetchingQuickMetadata || isQuickAdding}
                    onClick={() => fetchQuickMetadata(true)}
                    aria-label="重新识别网站信息"
                  >
                    {isFetchingQuickMetadata ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  输入后会自动识别，也可以点击右侧按钮重新识别。
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quick-title">站点名称 *</Label>
                  <Input
                    id="quick-title"
                    value={quickAddSite.title}
                    onChange={(event) => {
                      setQuickAddSite((site) => ({ ...site, title: event.target.value }))
                    }}
                    placeholder="自动获取网站标题"
                    disabled={isQuickAdding}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quick-icon">站点图标</Label>
                  <div className="relative">
                    <Input
                      id="quick-icon"
                      value={quickAddSite.icon}
                      onChange={(event) => {
                        setQuickAddSite((site) => ({ ...site, icon: event.target.value }))
                      }}
                      placeholder="自动获取图标"
                      disabled={isQuickAdding}
                    />
                    {quickAddSite.icon && (
                      <img
                        src={quickAddSite.icon}
                        alt=""
                        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>分类 *</Label>
                  <Select
                    value={quickAddSite.categoryId}
                    onValueChange={(value) => {
                      setQuickAddSite((site) => ({
                        ...site,
                        categoryId: value,
                        subCategoryId: '',
                      }))
                      setQuickAddMessage('')
                    }}
                    disabled={isQuickAdding || currentNavigationData.navigationItems.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentNavigationData.navigationItems.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>子分类</Label>
                  <Select
                    value={quickAddSite.subCategoryId || 'none'}
                    onValueChange={(value) => {
                      setQuickAddSite((site) => ({
                        ...site,
                        subCategoryId: value === 'none' ? '' : value,
                      }))
                    }}
                    disabled={isQuickAdding || !selectedQuickCategory?.subCategories?.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择子分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无子分类</SelectItem>
                      {selectedQuickCategory?.subCategories?.map((subCategory) => (
                        <SelectItem key={subCategory.id} value={subCategory.id}>
                          {subCategory.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-description">描述</Label>
                <Textarea
                  id="quick-description"
                  value={quickAddSite.description}
                  onChange={(event) => {
                    setQuickAddSite((site) => ({ ...site, description: event.target.value }))
                  }}
                  placeholder="自动获取网站描述"
                  className="min-h-[84px] resize-none"
                  disabled={isQuickAdding}
                />
              </div>

              {quickAddMessage && (
                <p className={cn(
                  'text-sm',
                  quickAddMessage.includes('成功') || quickAddMessage.includes('已识别')
                    ? 'text-emerald-600'
                    : quickAddMessage.includes('正在')
                      ? 'text-muted-foreground'
                      : 'text-destructive'
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
