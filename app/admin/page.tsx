'use client'

export const runtime = 'edge'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Database,
  ExternalLink,
  FolderTree,
  Folders,
  Globe,
  LayoutList,
  Plus,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Stats {
  parentCategories: number
  subCategories: number
  totalCategories: number
  totalSites: number
}

const initialStats: Stats = {
  parentCategories: 0,
  subCategories: 0,
  totalCategories: 0,
  totalSites: 0,
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>(initialStats)
  const [quickUrl, setQuickUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStats = async (showLoading = false) => {
    try {
      if (showLoading) setIsRefreshing(true)
      const response = await fetch('/api/admin/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      setStats(await response.json())
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      if (showLoading) setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()

    const handleFocus = () => fetchStats()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }

  const handleQuickAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const url = normalizeUrl(quickUrl)

    try {
      new URL(url)
      setUrlError('')
      router.push(`/admin/sitelist?add=1&url=${encodeURIComponent(url)}`)
    } catch {
      setUrlError('请输入有效的网址，例如 example.com')
    }
  }

  const statsItems = [
    { title: '站点总数', value: stats.totalSites, icon: Globe },
    { title: '分类总数', value: stats.totalCategories, icon: Database },
    { title: '一级分类', value: stats.parentCategories, icon: Folders },
    { title: '二级分类', value: stats.subCategories, icon: FolderTree },
  ]

  const quickActions = [
    {
      title: '管理站点',
      description: '搜索、编辑、移动或批量删除站点',
      href: '/admin/sitelist',
      icon: LayoutList,
    },
    {
      title: '管理分类',
      description: '调整导航分类、顺序和显示状态',
      href: '/admin/navigation',
      icon: Folders,
    },
    {
      title: '站点设置',
      description: '修改网站名称、Logo 和基础信息',
      href: '/admin/site',
      icon: Settings,
    },
    {
      title: '预览前台',
      description: '在新窗口查看当前线上页面',
      href: '/',
      icon: ExternalLink,
      external: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">管理控制台</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            快速添加网址并管理导航内容
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchStats(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新统计
        </Button>
      </div>

      <Card className="border-primary/15 bg-primary/[0.025] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            一键添加网址
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuickAdd} className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={quickUrl}
              onChange={(event) => {
                setQuickUrl(event.target.value)
                setUrlError('')
              }}
              placeholder="输入网址，例如 example.com"
              className="flex-1"
              autoFocus
            />
            <Button type="submit" className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              获取信息并添加
            </Button>
          </form>
          <div className="mt-2 min-h-5 text-xs">
            {urlError ? (
              <span className="text-destructive">{urlError}</span>
            ) : (
              <span className="text-muted-foreground">
                系统会自动获取网站标题、描述和图标，你只需选择分类并保存。
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statsItems.map((item) => (
          <Card key={item.title} className="shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p className="mt-1 text-2xl font-semibold">{item.value}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">常用操作</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
            >
              <Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <item.icon className="mb-3 h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium">保存与部署</p>
            <p className="mt-1 text-xs text-muted-foreground">
              后台保存后会提交到 GitHub，Cloudflare 将自动开始部署。
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            GitHub 自动同步模式
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
