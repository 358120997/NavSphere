import { NextResponse } from 'next/server'
import { getCurrentNavigationData } from '@/lib/user-data'

export const runtime = 'edge'

export async function GET() {
  try {
    const navigationData = await getCurrentNavigationData()

    return NextResponse.json(navigationData, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
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
