'use client'

export const runtime = 'edge'

import { useEffect, useState } from 'react'
import { RefreshCw, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AccountItem {
  id: string
  username: string
  name: string
  email: string
  createdAt: string
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch('/api/admin/accounts', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || '获取账号失败')
      }

      setAccounts(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取账号失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const deleteAccount = async (account: AccountItem) => {
    const confirmed = window.confirm(
      `确定删除账号 ${account.username} 吗？这会同时删除该账号的导航数据。`
    )

    if (!confirmed) return

    try {
      setDeletingId(account.id)
      setError('')
      const response = await fetch('/api/admin/accounts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: account.id, deleteData: true }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || '删除账号失败')
      }

      setAccounts((items) => items.filter((item) => item.id !== account.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除账号失败')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">账号管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            查看和清理注册账号，每个账号拥有独立后台数据。
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAccounts} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            注册账号
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
          ) : accounts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              暂无注册账号
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <div className="grid grid-cols-[1.1fr_1fr_1.2fr_1fr_auto] gap-3 border-b bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground">
                <span>用户名</span>
                <span>显示名称</span>
                <span>邮箱</span>
                <span>注册时间</span>
                <span>操作</span>
              </div>
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="grid grid-cols-[1.1fr_1fr_1.2fr_1fr_auto] items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{account.username}</p>
                    <p className="truncate text-xs text-muted-foreground">{account.id}</p>
                  </div>
                  <span className="truncate">{account.name || '-'}</span>
                  <span className="truncate text-muted-foreground">{account.email || '-'}</span>
                  <span className="text-muted-foreground">
                    {account.createdAt ? new Date(account.createdAt).toLocaleString() : '-'}
                  </span>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deletingId === account.id}
                      onClick={() => deleteAccount(account)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">说明</Badge>
            删除账号会从 accounts.json 移除账号，并尝试删除该账号的 navigation.json。
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
