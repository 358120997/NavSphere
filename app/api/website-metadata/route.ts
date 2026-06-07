import { NextResponse } from 'next/server'

export const runtime = 'edge'

interface WebsiteMetadata {
  title: string
  description: string
  icon: string
}

export async function POST(request: Request) {
  try {
    const { url: rawUrl } = await request.json()
    const url = normalizeUrl(String(rawUrl || ''))

    if (!url) {
      return NextResponse.json({ error: '请提供有效的网站链接' }, { status: 400 })
    }

    return NextResponse.json(await fetchWebsiteMetadata(url))
  } catch (error) {
    console.error('Failed to fetch website metadata:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取网站信息失败' },
      { status: 500 }
    )
  }
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    return new URL(withProtocol).toString()
  } catch {
    return ''
  }
}

async function fetchWebsiteMetadata(url: string): Promise<WebsiteMetadata> {
  const fallback = getFallbackMetadata(url)

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.7',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
      redirect: 'follow',
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      return fallback
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return fallback
    }

    const html = await response.text()
    const title =
      extractMetaContent(html, 'og:title') ||
      extractMetaContent(html, 'twitter:title') ||
      extractTitle(html) ||
      fallback.title

    const description =
      extractMetaContent(html, 'description') ||
      extractMetaContent(html, 'og:description') ||
      extractMetaContent(html, 'twitter:description') ||
      ''

    return {
      title: cleanText(title) || fallback.title,
      description: cleanText(description),
      icon: extractFavicon(html, url) || fallback.icon,
    }
  } catch (error) {
    console.warn('Website metadata fallback used:', error)
    return fallback
  }
}

function getFallbackMetadata(url: string): WebsiteMetadata {
  const parsed = new URL(url)
  const hostname = parsed.hostname.replace(/^www\./i, '')

  return {
    title: hostname,
    description: '',
    icon: `${parsed.origin}/favicon.ico`,
  }
}

function extractTitle(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return titleMatch?.[1] || ''
}

function extractMetaContent(html: string, name: string) {
  const tagPattern = /<meta\s+[^>]*>/gi
  const tags = html.match(tagPattern) || []

  for (const tag of tags) {
    const key =
      getAttribute(tag, 'name') ||
      getAttribute(tag, 'property') ||
      getAttribute(tag, 'itemprop')

    if (key?.toLowerCase() === name.toLowerCase()) {
      return getAttribute(tag, 'content') || ''
    }
  }

  return ''
}

function extractFavicon(html: string, baseUrl: string) {
  const tags = html.match(/<link\s+[^>]*>/gi) || []
  const relPriority = ['apple-touch-icon', 'shortcut icon', 'icon']

  for (const relName of relPriority) {
    const matchedTag = tags.find((tag) => {
      const rel = getAttribute(tag, 'rel')?.toLowerCase() || ''
      return rel.split(/\s+/).join(' ').includes(relName)
    })

    const href = matchedTag ? getAttribute(matchedTag, 'href') : ''
    if (href) {
      return new URL(href, baseUrl).toString()
    }
  }

  return getFallbackMetadata(baseUrl).icon
}

function getAttribute(tag: string, attribute: string) {
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escaped}\\s*=\\s*(["'])(.*?)\\1`, 'i')
  return tag.match(pattern)?.[2] || ''
}

function cleanText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}
