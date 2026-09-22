import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCurrentNavigationData } from '@/lib/user-data'

export const runtime = 'edge'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { navigationItems: [] },
        {
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const navigationData = await getCurrentNavigationData()

    return NextResponse.json(navigationData, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error in navigation API:', error)
    return NextResponse.json(
      { error: '获取导航数据失败' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
