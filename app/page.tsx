export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

import { NavigationContent } from '@/components/navigation-content'
import { Metadata } from 'next/types'
import { ScrollToTop } from '@/components/ScrollToTop'
import navigationData from '@/navsphere/content/navigation.json'
import siteData from '@/navsphere/content/site.json'
import type { NavigationData } from '@/types/navigation'
import type { SiteConfig } from '@/types/site'

const defaultNavigationData: NavigationData = { navigationItems: [] }
const defaultSiteData: SiteConfig = {
  basic: {
    title: 'NavSphere',
    description: '',
    keywords: ''
  },
  appearance: {
    logo: '',
    favicon: '',
    theme: 'system'
  }
}

async function getData() {
  try {
    // 添加数据验证日志
    console.log('Navigation data received:', !!navigationData)
    console.log('Site data received:', !!siteData)

    return { 
      navigationData: (navigationData || defaultNavigationData) as NavigationData, 
      siteData: (siteData || defaultSiteData) as SiteConfig
    }
  } catch (error) {
    console.error('Error in getData:', error)
    // 返回默认数据而不是空值
    return {
      navigationData: defaultNavigationData,
      siteData: defaultSiteData
    }
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteData } = await getData()
  
  return {
    title: siteData.basic.title,
    description: siteData.basic.description,
    keywords: siteData.basic.keywords,
    icons: {
      icon: siteData.appearance.favicon,
    },
  }
}

export function generateStaticParams() {
  return [{}]
}

export default async function HomePage() {
  const { navigationData, siteData } = await getData()
  
  console.log('Rendering HomePage with data:', { 
    hasNavigation: !!navigationData?.navigationItems,
    hasSiteData: !!siteData?.basic 
  })

  return (
    <>
      <NavigationContent navigationData={navigationData} siteData={siteData} />
      <ScrollToTop />
    </>
  )
}
