import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { DefaultSession, NextAuthConfig } from 'next-auth'
import { readAccounts, verifyPassword } from '@/lib/account-store'

declare module 'next-auth' {
  interface Session {
    user: {
      accessToken?: string
      accountId?: string
    } & DefaultSession['user']
  }
  interface User {
    accessToken?: string
    accountId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    accountId?: string
  }
}

const config = {
  providers: [
    CredentialsProvider({
      name: 'Local Account',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = String(credentials?.username || '')
        const password = String(credentials?.password || '')
        const accounts = await readAccounts()
        const account = accounts.find((item) => item.username === username)

        if (!account || !(await verifyPassword(account, password))) {
          return null
        }

        const accountId = account.id

        return {
          id: accountId,
          name: account.name || account.username,
          email: account.email || '',
          image: null,
          accessToken: process.env.GITHUB_TOKEN || '',
          accountId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const accessToken = process.env.GITHUB_TOKEN || user?.accessToken
      if (accessToken) {
        token.accessToken = accessToken
      }
      if (user?.accountId) {
        token.accountId = user.accountId
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.accessToken = process.env.GITHUB_TOKEN || (token.accessToken as string)
        session.user.accountId = token.accountId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.GITHUB_SECRET,
} satisfies NextAuthConfig

const handler = NextAuth(config)

export const auth = handler.auth
export const {
  handlers: { GET, POST },
} = handler
