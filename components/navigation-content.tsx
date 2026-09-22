'use client'

import { useEffect, useState, type DragEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { Loader2, Menu, Pencil, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
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
  initiallyAuthenticated?: boolean
}

interface QuickAddSite {
  url: string
  title: string
  description: string
  icon: string
  categoryId: string
  subCategoryId: string
}

interface ManageCardContext {
  item: NavigationSubItem
  categoryId: string
  subCategoryId: string
}

interface DragCardContext extends ManageCardContext {
  droppableId: string
  index: number
}

const emptyNavigationData: NavigationData = { navigationItems: [] }

const emptyQuickAddSite: QuickAddSite = {
  url: '',
  title: '',
  description: '',
  icon: '',
  categoryId: '',
  subCategoryId: '',
}

const DEFAULT_CATEGORY_TITLE = '常用推荐'

export function NavigationContent({ navigationData, siteData, initiallyAuthenticated = false }: NavigationContentProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentNavigationData, setCurrentNavigationData] = useState(navigationData || emptyNavigationData)
  const [navigationLoadMessage, setNavigationLoadMessage] = useState('')
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddSite, setQuickAddSite] = useState<QuickAddSite>(emptyQuickAddSite)
  const [quickAddMessage, setQuickAddMessage] = useState('')
  const [isQuickAdding, setIsQuickAdding] = useState(false)
  const [isFetchingQuickMetadata, setIsFetchingQuickMetadata] = useState(false)
  const [lastFetchedQuickUrl, setLastFetchedQuickUrl] = useState('')
  const [editingCard, setEditingCard] = useState<ManageCardContext | null>(null)
  const [editSite, setEditSite] = useState<QuickAddSite>(emptyQuickAddSite)
  const [editMessage, setEditMessage] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deletingCard, setDeletingCard] = useState<ManageCardContext | null>(null)
  const [isDeletingCard, setIsDeletingCard] = useState(false)
  const [isCardEditMode, setIsCardEditMode] = useState(false)
  const [draggingCard, setDraggingCard] = useState<DragCardContext | null>(null)
  const { data: session, status } = useSession()
  const userName = session?.user?.name || session?.user?.email || (session?.user as any)?.accountId
  const isAuthenticated = status === 'authenticated'
  const shouldShowLoginPrompt = status === 'unauthenticated' || (!initiallyAuthenticated && status === 'loading')
  const canManageCards = isAuthenticated && isCardEditMode
  const selectedQuickCategory = currentNavigationData.navigationItems.find(
    (category) => category.id === quickAddSite.categoryId
  )
  const selectedEditCategory = currentNavigationData.navigationItems.find(
    (category) => category.id === editSite.categoryId
  )

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }

  const getFirstSubCategoryId = (category?: NavigationItem) => (
    category?.subCategories?.[0]?.id || ''
  )

  const getDefaultQuickCategoryId = (data: NavigationData) => data.navigationItems?.[0]?.id || ''

  const createDefaultCategory = (item: NavigationSubItem): NavigationItem => ({
    id: `category_${Date.now()}`,
    title: DEFAULT_CATEGORY_TITLE,
    enabled: true,
    items: [item],
  })

  const addItemToNavigation = (
    data: NavigationData,
    item: NavigationSubItem,
    categoryId: string,
    subCategoryId: string
  ): NavigationData => {
    const navigationItems = [...(data.navigationItems || [])] as NavigationItem[]

    if (navigationItems.length === 0) {
      return {
        navigationItems: [createDefaultCategory(item)],
      }
    }

    const targetCategory = navigationItems.find((category) => category.id === categoryId)
    const targetSubCategoryId = targetCategory?.subCategories?.length
      ? subCategoryId || targetCategory.subCategories[0].id
      : ''

    const updatedItems = navigationItems.map((category) => {
      if (category.id !== categoryId) return category

      if (targetSubCategoryId && category.subCategories && category.subCategories.length > 0) {
        return {
          ...category,
          subCategories: category.subCategories.map((subCategory) => (
            subCategory.id === targetSubCategoryId
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

  const updateItemInNavigation = (
    data: NavigationData,
    context: ManageCardContext,
    nextItem: NavigationSubItem
  ): NavigationData => ({
    navigationItems: (data.navigationItems || []).map((category) => {
      if (category.id !== context.categoryId) return category

      if (context.subCategoryId && category.subCategories?.length) {
        return {
          ...category,
          subCategories: category.subCategories.map((subCategory) => (
            subCategory.id === context.subCategoryId
              ? {
                  ...subCategory,
                  items: (subCategory.items || []).map((item) => (
                    item.id === context.item.id ? nextItem : item
                  )),
                }
              : subCategory
          )),
        }
      }

      return {
        ...category,
        items: (category.items || []).map((item) => (
          item.id === context.item.id ? nextItem : item
        )),
      }
    }),
  })

  const deleteItemFromNavigation = (
    data: NavigationData,
    context: ManageCardContext
  ): NavigationData => ({
    navigationItems: (data.navigationItems || []).map((category) => {
      if (category.id !== context.categoryId) return category

      if (context.subCategoryId && category.subCategories?.length) {
        return {
          ...category,
          subCategories: category.subCategories.map((subCategory) => (
            subCategory.id === context.subCategoryId
              ? {
                  ...subCategory,
                  items: (subCategory.items || []).filter((item) => item.id !== context.item.id),
                }
              : subCategory
          )),
        }
      }

      return {
        ...category,
        items: (category.items || []).filter((item) => item.id !== context.item.id),
      }
    }),
  })

  const reorderItemsInNavigation = (
    data: NavigationData,
    droppableId: string,
    sourceIndex: number,
    destinationIndex: number
  ): NavigationData => {
    const [scope, categoryId, subCategoryId = ''] = droppableId.split(':')

    if (scope !== 'items') {
      return data
    }

    return {
      navigationItems: (data.navigationItems || []).map((category) => {
        if (category.id !== categoryId) return category

        if (subCategoryId && category.subCategories?.length) {
          return {
            ...category,
            subCategories: category.subCategories.map((subCategory) => {
              if (subCategory.id !== subCategoryId) return subCategory
              const items = [...(subCategory.items || [])]
              const [movedItem] = items.splice(sourceIndex, 1)
              items.splice(destinationIndex, 0, movedItem)
              return { ...subCategory, items }
            }),
          }
        }

        const items = [...(category.items || [])]
        const [movedItem] = items.splice(sourceIndex, 1)
        items.splice(destinationIndex, 0, movedItem)
        return { ...category, items }
      }),
    }
  }

  const moveOrUpdateItemInNavigation = (
    data: NavigationData,
    context: ManageCardContext,
    nextItem: NavigationSubItem,
    nextCategoryId: string,
    nextSubCategoryId: string
  ): NavigationData => {
    const sourceRemoved = deleteItemFromNavigation(data, context)
    return addItemToNavigation(sourceRemoved, nextItem, nextCategoryId, nextSubCategoryId)
  }

  const saveNavigation = async (data: NavigationData, errorMessage = '保存失败') => {
    const response = await fetch('/api/navigation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      throw new Error(error?.details || error?.error || errorMessage)
    }
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
      const hostname = (() => {
        try {
          return new URL(url).hostname.replace(/^www\./i, '')
        } catch {
          return ''
        }
      })()

      setQuickAddSite((site) => ({
        ...site,
        url,
        title: site.title || hostname,
      }))
      setQuickAddMessage(error instanceof Error ? error.message : '识别失败，可手动填写后添加')
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

    if (currentNavigationData.navigationItems.length > 0 && !quickAddSite.categoryId) {
      setQuickAddMessage('请选择分类')
      return
    }

    if (selectedQuickCategory?.subCategories?.length && !quickAddSite.subCategoryId) {
      setQuickAddMessage('请选择子分类')
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
        title: title || new URL(url).hostname.replace(/^www\./i, ''),
        href: url,
        description,
        icon,
        enabled: true,
      }
      const updatedNavigation = addItemToNavigation(
        navigation,
        newItem,
        quickAddSite.categoryId || getDefaultQuickCategoryId(navigation),
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

      const nextCategoryId = quickAddSite.categoryId || getDefaultQuickCategoryId(updatedNavigation)
      const nextCategory = updatedNavigation.navigationItems.find((category) => category.id === nextCategoryId)
      const nextSubCategoryId = getFirstSubCategoryId(nextCategory)

      setCurrentNavigationData(updatedNavigation)
      setQuickAddSite({
        ...emptyQuickAddSite,
        categoryId: nextCategoryId,
        subCategoryId: nextSubCategoryId,
      })
      setLastFetchedQuickUrl('')
      setQuickAddMessage('添加成功，Cloudflare 会自动同步部署。')
      window.setTimeout(() => setIsQuickAddOpen(false), 500)
    } catch (error) {
      setQuickAddMessage(error instanceof Error ? error.message : '添加失败')
    } finally {
      setIsQuickAdding(false)
    }
  }

  const openEditCard = (context: ManageCardContext) => {
    setEditingCard(context)
    setEditSite({
      url: context.item.href,
      title: context.item.title,
      description: context.item.description || '',
      icon: context.item.icon || '',
      categoryId: context.categoryId,
      subCategoryId: context.subCategoryId,
    })
    setEditMessage('')
  }

  const fetchEditMetadata = async () => {
    const url = normalizeUrl(editSite.url)

    try {
      new URL(url)
    } catch {
      setEditMessage('请输入有效的网址，例如 example.com')
      return
    }

    setIsSavingEdit(true)
    setEditMessage('正在识别网站信息...')

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
      setEditSite((site) => ({
        ...site,
        url,
        title: metadata.title || site.title,
        description: metadata.description || site.description,
        icon: metadata.icon || site.icon,
      }))
      setEditMessage('已识别网站信息')
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : '识别失败，可手动填写后保存')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleEditCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingCard) return

    const url = normalizeUrl(editSite.url)

    try {
      new URL(url)
    } catch {
      setEditMessage('请输入有效的网址，例如 example.com')
      return
    }

    if (!editSite.title.trim()) {
      setEditMessage('请输入站点名称')
      return
    }

    if (!editSite.categoryId) {
      setEditMessage('请选择分类')
      return
    }

    const targetCategory = currentNavigationData.navigationItems.find((category) => category.id === editSite.categoryId)
    if (targetCategory?.subCategories?.length && !editSite.subCategoryId) {
      setEditMessage('请选择子分类')
      return
    }

    setIsSavingEdit(true)
    setEditMessage('')

    try {
      const nextItem: NavigationSubItem = {
        ...editingCard.item,
        title: editSite.title.trim(),
        href: url,
        description: editSite.description.trim(),
        icon: editSite.icon.trim(),
        enabled: editingCard.item.enabled ?? true,
      }
      const sameLocation =
        editSite.categoryId === editingCard.categoryId &&
        editSite.subCategoryId === editingCard.subCategoryId
      const updatedNavigation = sameLocation
        ? updateItemInNavigation(currentNavigationData, editingCard, nextItem)
        : moveOrUpdateItemInNavigation(
            currentNavigationData,
            editingCard,
            nextItem,
            editSite.categoryId,
            editSite.subCategoryId
          )

      await saveNavigation(updatedNavigation, '更新失败')
      setCurrentNavigationData(updatedNavigation)
      setEditMessage('更新成功')
      window.setTimeout(() => {
        setEditingCard(null)
        setEditMessage('')
      }, 450)
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : '更新失败')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteCard = async () => {
    if (!deletingCard) return

    setIsDeletingCard(true)

    try {
      const updatedNavigation = deleteItemFromNavigation(currentNavigationData, deletingCard)
      await saveNavigation(updatedNavigation, '删除失败')
      setCurrentNavigationData(updatedNavigation)
      setDeletingCard(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : '删除失败')
    } finally {
      setIsDeletingCard(false)
    }
  }

  const handleCardDrop = async (event: DragEvent<HTMLDivElement>, target: DragCardContext) => {
    event.preventDefault()

    if (!draggingCard) return
    if (draggingCard.droppableId !== target.droppableId) return
    if (draggingCard.index === target.index) return

    const previousNavigation = currentNavigationData
    const updatedNavigation = reorderItemsInNavigation(
      currentNavigationData,
      draggingCard.droppableId,
      draggingCard.index,
      target.index
    )

    setCurrentNavigationData(updatedNavigation)

    try {
      await saveNavigation(updatedNavigation, '排序保存失败')
    } catch (error) {
      setCurrentNavigationData(previousNavigation)
      alert(error instanceof Error ? error.message : '排序保存失败')
    }
  }

  useEffect(() => {
    if (!isQuickAddOpen) {
      return
    }

    setQuickAddSite((site) => {
      const categoryId = site.categoryId || getDefaultQuickCategoryId(currentNavigationData)
      const category = currentNavigationData.navigationItems.find((item) => item.id === categoryId)
      const subCategoryId = category?.subCategories?.length
        ? site.subCategoryId || category.subCategories[0].id
        : ''

      return {
        ...site,
        categoryId,
        subCategoryId,
      }
    })
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
    setNavigationLoadMessage('')

    if (status !== 'authenticated') {
      setCurrentNavigationData(emptyNavigationData)
      return () => {
        isMounted = false
      }
    }

    fetch('/api/home/navigation', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('读取导航失败')
        }
        return response.json()
      })
      .then((data) => {
        if (isMounted) {
          setCurrentNavigationData(data?.navigationItems ? data : emptyNavigationData)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setCurrentNavigationData(emptyNavigationData)
          setNavigationLoadMessage(error instanceof Error ? error.message : '读取导航失败')
        }
      })
    return () => {
      isMounted = false
    }
  }, [status])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 sm:flex-row">
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
            'fixed inset-y-0 right-0 w-44 transform bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] transition-transform duration-200 ease-in-out sm:left-0',
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
        <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 px-3 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-[1500px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <SearchBar />
            </div>
            <div className="flex items-center gap-1">
              {status === 'authenticated' ? (
                <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
                  <span className="hidden max-w-24 truncate sm:inline">{userName}</span>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium transition',
                      isCardEditMode
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-200 hover:text-slate-950'
                    )}
                    onClick={() => setIsCardEditMode((value) => !value)}
                    aria-pressed={isCardEditMode}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{isCardEditMode ? '完成' : '编辑'}</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 font-medium text-slate-700 transition hover:text-slate-950"
                    onClick={() => {
                      setQuickAddMessage('')
                      setIsQuickAddOpen(true)
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">添加</span>
                  </button>
                  <button
                    type="button"
                    className="font-medium text-slate-700 transition hover:text-slate-950"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    退出
                  </button>
                </div>
              ) : status === 'loading' ? (
                <div className="h-8 w-24 rounded-lg bg-white shadow-sm ring-1 ring-slate-200" />
              ) : (
                <div className="flex items-center gap-1">
                  <Link href="/auth/signin?callbackUrl=/" aria-label="登录">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg px-3 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                    >
                      登录
                    </Button>
                  </Link>
                  <Link href="/auth/register?callbackUrl=/admin" aria-label="注册">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden rounded-lg px-3 text-slate-700 hover:bg-slate-100 hover:text-slate-950 sm:inline-flex"
                    >
                      注册
                    </Button>
                  </Link>
                </div>
              )}
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
                输入网址后自动识别网站信息，选择分类后直接添加到当前账号的前台导航。
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
                  输入后会自动识别。遇到网站限制访问时，也可以手动填写后添加。
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
                      const category = currentNavigationData.navigationItems.find((item) => item.id === value)
                      setQuickAddSite((site) => ({
                        ...site,
                        categoryId: value,
                        subCategoryId: getFirstSubCategoryId(category),
                      }))
                      setQuickAddMessage('')
                    }}
                    disabled={isQuickAdding || currentNavigationData.navigationItems.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={currentNavigationData.navigationItems.length ? '选择分类' : '将自动创建常用推荐'} />
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
                    value={quickAddSite.subCategoryId}
                    onValueChange={(value) => {
                      setQuickAddSite((site) => ({
                        ...site,
                        subCategoryId: value,
                      }))
                    }}
                    disabled={isQuickAdding || !selectedQuickCategory?.subCategories?.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedQuickCategory?.subCategories?.length ? '选择子分类' : '无子分类'} />
                    </SelectTrigger>
                    <SelectContent>
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
                      添加中...
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

        <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
          <DialogContent className="border-slate-200 bg-white text-slate-900 shadow-xl sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>编辑网址</DialogTitle>
              <DialogDescription>
                直接在前台修改站点信息，保存后会同步到当前账号的数据。
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditCard} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-url">网址 *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-url"
                    value={editSite.url}
                    onChange={(event) => {
                      setEditSite((site) => ({ ...site, url: event.target.value }))
                      setEditMessage('')
                    }}
                    placeholder="example.com"
                    disabled={isSavingEdit}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!editSite.url || isSavingEdit}
                    onClick={fetchEditMetadata}
                    aria-label="重新识别网站信息"
                  >
                    {isSavingEdit ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">站点名称 *</Label>
                  <Input
                    id="edit-title"
                    value={editSite.title}
                    onChange={(event) => {
                      setEditSite((site) => ({ ...site, title: event.target.value }))
                    }}
                    placeholder="站点名称"
                    disabled={isSavingEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-icon">站点图标</Label>
                  <div className="relative">
                    <Input
                      id="edit-icon"
                      value={editSite.icon}
                      onChange={(event) => {
                        setEditSite((site) => ({ ...site, icon: event.target.value }))
                      }}
                      placeholder="图标 URL"
                      disabled={isSavingEdit}
                    />
                    {editSite.icon && (
                      <img
                        src={editSite.icon}
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
                    value={editSite.categoryId}
                    onValueChange={(value) => {
                      const category = currentNavigationData.navigationItems.find((item) => item.id === value)
                      setEditSite((site) => ({
                        ...site,
                        categoryId: value,
                        subCategoryId: getFirstSubCategoryId(category),
                      }))
                      setEditMessage('')
                    }}
                    disabled={isSavingEdit || currentNavigationData.navigationItems.length === 0}
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
                    value={editSite.subCategoryId}
                    onValueChange={(value) => {
                      setEditSite((site) => ({
                        ...site,
                        subCategoryId: value,
                      }))
                      setEditMessage('')
                    }}
                    disabled={isSavingEdit || !selectedEditCategory?.subCategories?.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedEditCategory?.subCategories?.length ? '选择子分类' : '无子分类'} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedEditCategory?.subCategories?.map((subCategory) => (
                        <SelectItem key={subCategory.id} value={subCategory.id}>
                          {subCategory.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">描述</Label>
                <Textarea
                  id="edit-description"
                  value={editSite.description}
                  onChange={(event) => {
                    setEditSite((site) => ({ ...site, description: event.target.value }))
                  }}
                  placeholder="站点描述"
                  className="min-h-[90px] resize-none"
                  disabled={isSavingEdit}
                />
              </div>

              {editMessage && (
                <p className={cn(
                  'text-sm',
                  editMessage.includes('成功') || editMessage.includes('已识别')
                    ? 'text-emerald-700'
                    : editMessage.includes('正在')
                      ? 'text-slate-500'
                      : 'text-destructive'
                )}>
                  {editMessage}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingCard(null)}
                  disabled={isSavingEdit}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSavingEdit}>
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存修改
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deletingCard} onOpenChange={(open) => !open && setDeletingCard(null)}>
          <DialogContent className="border-slate-200 bg-white text-slate-900 shadow-xl sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>删除网址</DialogTitle>
              <DialogDescription>
                确定要删除“{deletingCard?.item.title}”吗？删除后会立即同步到当前账号的数据。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeletingCard(null)}
                disabled={isDeletingCard}
              >
                取消
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeleteCard}
                disabled={isDeletingCard}
              >
                {isDeletingCard ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mx-auto max-w-[1540px] px-3 py-6 sm:px-6 sm:py-8">
          {shouldShowLoginPrompt ? (
            <div className="mx-auto max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400" />
              <div className="px-6 py-16">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <Menu className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-950">登录后查看个人书签</h2>
                <p className="mt-2 text-sm text-slate-500">未登录状态不会展示默认书签，也不会闪现其他账号的数据。</p>
                <div className="mt-6 flex justify-center">
                  <Link href="/auth/signin?callbackUrl=/" className="inline-flex">
                    <Button className="gap-2 rounded-lg bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800">
                      登录
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : currentNavigationData.navigationItems.length === 0 ? (
            <div className="mx-auto max-w-xl overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white text-center shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
              <div className="h-1 bg-gradient-to-r from-slate-300 via-sky-300 to-slate-300" />
              <div className="px-6 py-16">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-slate-200">
                  <Plus className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-950">还没有个人书签</h2>
                <p className="mt-2 text-sm text-slate-500">
                  点击右上角添加，创建属于这个账号的导航。
                </p>
                {navigationLoadMessage && (
                  <p className="mt-3 text-xs text-red-600">{navigationLoadMessage}</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="space-y-10">
                {currentNavigationData.navigationItems.map((category) => (
                  <section key={category.id} id={category.id} className="scroll-m-24">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-1 rounded-full bg-sky-500" />
                        <h2 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
                          {category.title}
                        </h2>
                      </div>

                      {category.subCategories && category.subCategories.length > 0 ? (
                        category.subCategories.map((subCategory) => (
                          <div key={subCategory.id} id={subCategory.id} className="space-y-3 scroll-m-24">
                            <h3 className="pl-4 text-sm font-medium text-slate-500">
                              {subCategory.title}
                            </h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                              {(subCategory.items || []).map((item, index) => {
                                const dragContext = {
                                  item,
                                  categoryId: category.id,
                                  subCategoryId: subCategory.id,
                                  droppableId: `items:${category.id}:${subCategory.id}`,
                                  index,
                                }

                                return (
                                  <div
                                    key={item.id}
                                    onDragOver={(event) => canManageCards && event.preventDefault()}
                                    onDrop={(event) => handleCardDrop(event, dragContext)}
                                  >
                                    <NavigationCard
                                      item={item}
                                      canManage={canManageCards}
                                      isDragging={draggingCard?.item.id === item.id}
                                      dragRootProps={{
                                        draggable: canManageCards,
                                        onDragStart: (event) => {
                                          event.dataTransfer.effectAllowed = 'move'
                                          event.dataTransfer.setData('text/plain', item.id)
                                          setDraggingCard(dragContext)
                                        },
                                        onDragEnd: () => setDraggingCard(null),
                                      }}
                                      dragHandleProps={{
                                        onClick: (event) => {
                                          event.preventDefault()
                                          event.stopPropagation()
                                        },
                                      }}
                                      onEdit={() => openEditCard({
                                        item,
                                        categoryId: category.id,
                                        subCategoryId: subCategory.id,
                                      })}
                                      onDelete={() => setDeletingCard({
                                        item,
                                        categoryId: category.id,
                                        subCategoryId: subCategory.id,
                                      })}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                          {(category.items || []).map((item, index) => {
                            const dragContext = {
                              item,
                              categoryId: category.id,
                              subCategoryId: '',
                              droppableId: `items:${category.id}:`,
                              index,
                            }

                            return (
                              <div
                                key={item.id}
                                onDragOver={(event) => canManageCards && event.preventDefault()}
                                onDrop={(event) => handleCardDrop(event, dragContext)}
                              >
                                <NavigationCard
                                  item={item}
                                  canManage={canManageCards}
                                  isDragging={draggingCard?.item.id === item.id}
                                  dragRootProps={{
                                    draggable: canManageCards,
                                    onDragStart: (event) => {
                                      event.dataTransfer.effectAllowed = 'move'
                                      event.dataTransfer.setData('text/plain', item.id)
                                      setDraggingCard(dragContext)
                                    },
                                    onDragEnd: () => setDraggingCard(null),
                                  }}
                                  dragHandleProps={{
                                    onClick: (event) => {
                                      event.preventDefault()
                                      event.stopPropagation()
                                    },
                                  }}
                                  onEdit={() => openEditCard({
                                    item,
                                    categoryId: category.id,
                                    subCategoryId: '',
                                  })}
                                  onDelete={() => setDeletingCard({
                                    item,
                                    categoryId: category.id,
                                    subCategoryId: '',
                                  })}
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>

        <Footer siteInfo={siteData} />
      </main>
    </div>
  )
}
