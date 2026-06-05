import { NextResponse } from 'next/server'
import {
  createSalt,
  hashPassword,
  normalizeAccountId,
  readAccounts,
  readRegisteredAccounts,
  saveRegisteredAccounts,
} from '@/lib/account-store'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { username, password, name, email } = await request.json()
    const cleanUsername = String(username || '').trim()
    const cleanPassword = String(password || '')
    const cleanEmail = String(email || '').trim()
    const cleanName = String(name || '').trim()

    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: '用户名只能包含字母、数字、下划线或短横线，长度 3-32 位' },
        { status: 400 }
      )
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要 6 位' },
        { status: 400 }
      )
    }

    const accountId = normalizeAccountId(cleanUsername)
    const accounts = await readAccounts()
    const exists = accounts.some((account) => {
      const sameId = account.id === accountId
      const sameUsername = account.username.toLowerCase() === cleanUsername.toLowerCase()
      const sameEmail = cleanEmail && account.email?.toLowerCase() === cleanEmail.toLowerCase()
      return sameId || sameUsername || sameEmail
    })

    if (exists) {
      return NextResponse.json(
        { error: '用户名或邮箱已存在' },
        { status: 409 }
      )
    }

    const salt = createSalt()
    const registeredAccounts = await readRegisteredAccounts()

    await saveRegisteredAccounts([
      ...registeredAccounts,
      {
        id: accountId,
        username: cleanUsername,
        passwordHash: await hashPassword(cleanPassword, salt),
        salt,
        name: cleanName || cleanUsername,
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      },
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to register account:', error)
    return NextResponse.json(
      {
        error: '注册失败',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
