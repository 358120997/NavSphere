import { auth } from '@/lib/auth'
import { getFileContent } from '@/lib/github'
import { normalizeAccountId, readAccounts } from '@/lib/account-store'

export const DEFAULT_NAVIGATION_PATH = 'navsphere/content/navigation.json'
export const DEFAULT_SITE_PATH = 'navsphere/content/site.json'

export function getAccountNavigationPath(accountId?: string | null) {
  if (!accountId) {
    return DEFAULT_NAVIGATION_PATH
  }

  return `navsphere/users/${accountId}/navigation.json`
}

export async function getCurrentAccountId() {
  const session = await auth()
  const user = session?.user as any

  if (!user) {
    return null
  }

  if (user.accountId) {
    return user.accountId
  }

  if (user.username) {
    return normalizeAccountId(user.username)
  }

  const accounts = await readAccounts()
  const matchedAccount = accounts.find((account) => {
    const sameEmail = user.email && account.email?.toLowerCase() === user.email.toLowerCase()
    const sameUsername = user.name && account.username.toLowerCase() === user.name.toLowerCase()
    return sameEmail || sameUsername
  })

  if (matchedAccount) {
    return matchedAccount.id
  }

  return user.name ? normalizeAccountId(user.name) : null
}

export async function getCurrentNavigationPath() {
  return getAccountNavigationPath(await getCurrentAccountId())
}

export async function getRequiredCurrentNavigationPath() {
  const accountId = await getCurrentAccountId()

  if (!accountId) {
    throw new Error('当前登录账号缺少账号标识，无法保存个人导航数据')
  }

  return getAccountNavigationPath(accountId)
}

export async function getCurrentNavigationData() {
  return getFileContent(await getCurrentNavigationPath())
}
