export interface StoredAccount {
  id: string
  username: string
  password?: string
  passwordHash?: string
  salt?: string
  name?: string
  email?: string
  createdAt?: string
  source?: 'legacy' | 'registered'
}

interface AccountsFile {
  users: StoredAccount[]
}

export const ACCOUNTS_PATH = 'navsphere/content/accounts.json'

export function normalizeAccountId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'user'
}

function getGitHubConfig() {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'
  const token = process.env.GITHUB_TOKEN

  if (!owner || !repo) {
    throw new Error('Missing GITHUB_OWNER or GITHUB_REPO environment variable')
  }

  return { owner, repo, branch, token }
}

export function getLegacyAccounts(): StoredAccount[] {
  const accountsJson = process.env.ADMIN_USERS

  if (accountsJson) {
    try {
      const parsed = JSON.parse(accountsJson)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((account) => account?.username && account?.password)
          .map((account) => ({
            id: normalizeAccountId(account.username),
            username: account.username,
            password: account.password,
            name: account.name,
            email: account.email,
            source: 'legacy' as const,
          }))
      }
    } catch (error) {
      console.error('Invalid ADMIN_USERS JSON:', error)
    }
  }

  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    return [
      {
        id: normalizeAccountId(process.env.ADMIN_USERNAME),
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        source: 'legacy',
      },
    ]
  }

  return []
}

export function getAdminAccountIds() {
  return getLegacyAccounts().map((account) => account.id)
}

export function isAdminAccountId(accountId?: string | null) {
  return !!accountId && getAdminAccountIds().includes(accountId)
}

export async function hashPassword(password: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function createSalt() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(account: StoredAccount, password: string) {
  if (account.passwordHash && account.salt) {
    return (await hashPassword(password, account.salt)) === account.passwordHash
  }

  return account.password === password
}

export async function readRegisteredAccounts(): Promise<StoredAccount[]> {
  try {
    const { owner, repo, branch, token } = getGitHubConfig()
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${ACCOUNTS_PATH}?ref=${branch}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3.raw',
          Authorization: token ? `Bearer ${token}` : '',
          'User-Agent': 'NavSphere',
        },
        cache: 'no-store',
      }
    )

    if (response.status === 404) {
      return []
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`)
    }

    const data = await response.json() as AccountsFile
    return Array.isArray(data.users) ? data.users : []
  } catch (error) {
    console.error('Failed to read accounts:', error)
    return []
  }
}

export async function readAccounts(): Promise<StoredAccount[]> {
  const registeredAccounts = (await readRegisteredAccounts()).map((account) => ({
    ...account,
    source: 'registered' as const,
  }))
  return [...getLegacyAccounts(), ...registeredAccounts]
}

function encodeBase64(content: string) {
  const bytes = new TextEncoder().encode(content)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary)
}

export async function saveRegisteredAccounts(users: StoredAccount[]) {
  const { owner, repo, branch, token } = getGitHubConfig()

  if (!token) {
    throw new Error('Missing GITHUB_TOKEN environment variable')
  }

  const currentFileResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${ACCOUNTS_PATH}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'NavSphere',
      },
      cache: 'no-store',
    }
  )

  let sha: string | undefined
  if (currentFileResponse.ok) {
    const currentFile = await currentFileResponse.json()
    sha = currentFile.sha
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${ACCOUNTS_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'NavSphere',
      },
      body: JSON.stringify({
        message: 'Update registered accounts',
        content: encodeBase64(JSON.stringify({ users }, null, 2)),
        sha,
        branch,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to save accounts: ${error.message}`)
  }

  return response.json()
}

export async function deleteRepositoryFile(path: string, message: string) {
  const { owner, repo, branch, token } = getGitHubConfig()

  if (!token) {
    throw new Error('Missing GITHUB_TOKEN environment variable')
  }

  const currentFileResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'NavSphere',
      },
      cache: 'no-store',
    }
  )

  if (currentFileResponse.status === 404) {
    return null
  }

  if (!currentFileResponse.ok) {
    const error = await currentFileResponse.json()
    throw new Error(`Failed to read file before delete: ${error.message}`)
  }

  const currentFile = await currentFileResponse.json()
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'NavSphere',
      },
      body: JSON.stringify({
        message,
        sha: currentFile.sha,
        branch,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to delete file: ${error.message}`)
  }

  return response.json()
}
