import Link from 'next/link'
import type { SiteConfig } from '@/types/site'

interface FooterProps {
  siteInfo: SiteConfig
}

export function Footer({ siteInfo }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-8 border-t border-slate-200 bg-white/80 py-6 backdrop-blur md:py-0">
      <div className="container flex flex-col items-center gap-3 md:h-16 md:flex-row md:justify-center">
        <div className="flex flex-col items-center gap-3 px-8 md:flex-row md:gap-4 md:px-0">
          <p className="text-center text-sm leading-loose text-slate-500">
            {currentYear} {siteInfo.basic.title}. All rights reserved.
          </p>
          <Link
            href="/admin"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            管理后台
          </Link>
        </div>
      </div>
    </footer>
  )
}
