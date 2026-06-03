import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { DefaultSession, NextAuthConfig } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      accessToken?: string
    } & DefaultSession['user']
  }
  interface JWT {
    accessToken?: string
  }
  interface User {
    accessToken?: string
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
        const adminUsername = process.env.ADMIN_USERNAME
        const adminPassword = process.env.ADMIN_PASSWORD

        if (!adminUsername || !adminPassword) {
          return null
        }

        if (username !== adminUsername || password !== adminPassword) {
          return null
        }

        return {
          id: 'local-admin',
          name: process.env.ADMIN_NAME || adminUsername,
          email: process.env.ADMIN_EMAIL || '',
          image: null,
          accessToken: process.env.GITHUB_TOKEN || '',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.accessToken) {
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.accessToken = token.accessToken as string
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
