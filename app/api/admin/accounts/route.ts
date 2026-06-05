import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  deleteRepositoryFile,
  isAdminAccountId,
  readRegisteredAccounts,
  saveRegisteredAccounts,
} from '@/lib/account-store'
import { getAccountNavigationPath } from '@/lib/user-data'

export const runtime = 'edge'

async function requireAdmin() {
  const session = await auth()
  const accountId = (session?.user as any)?.accountId

  if (!accountId || !isAdminAccountId(accountId)) {
    return null
  }

  return session
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: '无权访问账号管理' }, { status: 403 })
    }

    const users = await readRegisteredAccounts()
    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        email: user.email || '',
        createdAt: user.createdAt || '',
      })),
    })
  } catch (error) {
    console.error('Failed to list accounts:', error)
    return NextResponse.json(
      { error: '获取账号列表失败', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: '无权删除账号' }, { status: 403 })
    }

    const { id, deleteData = true } = await request.json()
    const accountId = String(id || '').trim()

    if (!accountId) {
      return NextResponse.json({ error: '缺少账号 ID' }, { status: 400 })
    }

    const users = await readRegisteredAccounts()
    const target = users.find((user) => user.id === accountId)

    if (!target) {
      return NextResponse.json({ error: '账号不存在' }, { status: 404 })
    }

    await saveRegisteredAccounts(users.filter((user) => user.id !== accountId))

    if (deleteData) {
      await deleteRepositoryFile(
        getAccountNavigationPath(accountId),
        `Delete navigation data for ${target.username}`
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete account:', error)
    return NextResponse.json(
      { error: '删除账号失败', details: (error as Error).message },
      { status: 500 }
    )
  }
}
