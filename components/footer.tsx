import Link from 'next/link'
import type { SiteConfig } from '@/types/site'

interface FooterProps {
  siteInfo: SiteConfig
}

export function Footer({ siteInfo }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-4 border-t border-[#aeb8c1]/45 bg-[#cbd3da]/80 py-6 dark:border-white/5 dark:bg-[#25282b]/70 md:py-0">
      <div className="container flex flex-col items-center gap-3 md:h-16 md:flex-row md:justify-center">
        <div className="flex flex-col items-center gap-3 px-8 md:flex-row md:gap-4 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            {currentYear} {siteInfo.basic.title}. All rights reserved.
          </p>
          <Link
            href="/admin"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            管理后台
          </Link>
        </div>
      </div>
    </footer>
  )
}
