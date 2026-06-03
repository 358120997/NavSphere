'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import * as LucideIcons from 'lucide-react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/registry/new-york/ui/button'
import { ScrollArea } from '@/registry/new-york/ui/scroll-area'
import type { NavigationData } from '@/types/navigation'
import type { SiteConfig } from '@/types/site'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  navigationData: NavigationData
  siteInfo: SiteConfig
  onClose?: () => void
}

export function Sidebar({ className, navigationData, siteInfo, onClose }: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    return navigationData.navigationItems.reduce((acc, category) => {
      acc[category.id] = false
      return acc
    }, {} as Record<string, boolean>)
  })

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      onClose?.()
    }
  }

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <LucideIcons.Folder className="h-4 w-4" />

    if (iconName.startsWith('/') || iconName.startsWith('http')) {
      return (
        <Image
          src={iconName}
          alt="icon"
          width={16}
          height={16}
          className="h-4 w-4 object-contain"
        />
      )
    }

    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Folder
    return <IconComponent className="h-4 w-4" />
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  return (
    <div className={cn('w-32 bg-background/95 backdrop-blur', className)}>
      <div className="flex h-16 items-center px-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
          {siteInfo.appearance.logo ? (
            <Image
              src={siteInfo.appearance.logo}
              alt={siteInfo.basic.title}
              width={32}
              height={32}
              className="h-7 w-7 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LucideIcons.Globe className="h-5 w-5" />
            </div>
          )}
          <span className="truncate text-sm">{siteInfo.basic.title}</span>
        </Link>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)] px-3 py-3">
        <div className="space-y-2">
          {navigationData.navigationItems.map((category) => (
            <div key={category.id} className="py-1">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  className="min-w-0 flex-1 justify-start gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                  onClick={() => scrollToSection(category.id)}
                >
                  {renderIcon(category.icon)}
                  <span className="truncate">{category.title}</span>
                </Button>

                {category.subCategories && category.subCategories.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-0.5 h-8 rounded-lg px-1.5 hover:bg-accent/60"
                    onClick={() => toggleCategory(category.id)}
                    aria-label="Toggle category"
                  >
                    {expandedCategories[category.id] ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                )}
              </div>

              {category.subCategories && category.subCategories.length > 0 && (
                <div
                  className={cn(
                    'mt-1 space-y-1 overflow-hidden pl-6 transition-all duration-200 ease-in-out',
                    expandedCategories[category.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  {category.subCategories.map((subCategory) => (
                    <Button
                      key={subCategory.id}
                      variant="ghost"
                      className="w-full justify-start rounded-lg px-2 text-xs text-muted-foreground/80 transition-colors hover:bg-accent/50 hover:text-foreground"
                      onClick={() => scrollToSection(subCategory.id)}
                    >
                      <span className="truncate">{subCategory.title}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
