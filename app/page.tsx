export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NavigationContent } from '@/components/navigation-content'
import { Metadata } from 'next/types'
import { ScrollToTop } from '@/components/ScrollToTop'
import siteData from '@/navsphere/content/site.json'
import { auth } from '@/lib/auth'
import { getCurrentNavigationData } from '@/lib/user-data'
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
    const session = await auth()
    const navigationData = session?.user
      ? await getCurrentNavigationData().catch((error) => {
          console.error('Error loading account navigation:', error)
          return defaultNavigationData
        })
      : defaultNavigationData

    return { 
      navigationData,
      siteData: (siteData || defaultSiteData) as SiteConfig
    }
  } catch (error) {
    console.error('Error in getData:', error)
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
