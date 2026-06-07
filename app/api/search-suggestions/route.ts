import { NextResponse } from 'next/server'

export const runtime = 'edge'

type SearchEngine = 'baidu' | 'bing'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') || '').trim()
  const engine = (searchParams.get('engine') || 'baidu') as SearchEngine

  if (!query) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const suggestions = engine === 'bing'
      ? await fetchBingSuggestions(query)
      : await fetchBaiduSuggestions(query)

    return NextResponse.json(
      { suggestions: suggestions.slice(0, 8) },
      { headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=3600' } }
    )
  } catch (error) {
    console.error('Failed to fetch search suggestions:', error)
    return NextResponse.json({ suggestions: [] })
  }
}

async function fetchBaiduSuggestions(query: string) {
  const response = await fetch(
    `https://www.baidu.com/sugrec?ie=utf-8&prod=pc&wd=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: 'application/json,text/plain,*/*',
        'User-Agent': 'Mozilla/5.0 NavSphere',
      },
    }
  )

  if (!response.ok) return []

  const data = await response.json().catch(() => null)
  if (!Array.isArray(data?.g)) return []

  return data.g
    .map((item: { q?: string }) => item.q)
    .filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
}

async function fetchBingSuggestions(query: string) {
  const response = await fetch(
    `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: 'application/json,text/plain,*/*',
        'User-Agent': 'Mozilla/5.0 NavSphere',
      },
    }
  )

  if (!response.ok) return []

  const data = await response.json().catch(() => null)
  if (!Array.isArray(data?.[1])) return []

  return data[1].filter((item: unknown): item is string => (
    typeof item === 'string' && item.trim().length > 0
  ))
}
