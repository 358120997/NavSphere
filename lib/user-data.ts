import { auth } from '@/lib/auth'
import { getFileContent } from '@/lib/github'

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
  return (session?.user as any)?.accountId || null
}

export async function getCurrentNavigationPath() {
  return getAccountNavigationPath(await getCurrentAccountId())
}

export async function getCurrentNavigationData() {
  const path = await getCurrentNavigationPath()
  const data = await getFileContent(path)

  if (
    path !== DEFAULT_NAVIGATION_PATH &&
    Array.isArray(data?.navigationItems) &&
    data.navigationItems.length === 0
  ) {
    return getFileContent(DEFAULT_NAVIGATION_PATH)
  }

  return data
}
