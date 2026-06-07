'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/registry/new-york/ui/card'
import type { NavigationSubItem } from '@/types/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavigationCardProps {
  item: NavigationSubItem
}

const pastelStyles = [
  {
    card: 'bg-[#ddd6d4] hover:bg-[#cdc1bf]',
    icon: 'bg-[#d1c7c5]',
  },
  {
    card: 'bg-[#d6ded9] hover:bg-[#c3d0c8]',
    icon: 'bg-[#c8d2cd]',
  },
  {
    card: 'bg-[#d5dbe2] hover:bg-[#c1cbd5]',
    icon: 'bg-[#c7d0da]',
  },
  {
    card: 'bg-[#dedbd2] hover:bg-[#cec7b8]',
    icon: 'bg-[#d2ccbf]',
  },
  {
    card: 'bg-[#d9d6df] hover:bg-[#c9c1d1]',
    icon: 'bg-[#cdc7d6]',
  },
] as const

export function NavigationCard({ item }: NavigationCardProps) {
  const [pastelIndex, setPastelIndex] = useState<number | null>(null)

  useEffect(() => {
    setPastelIndex(Math.floor(Math.random() * pastelStyles.length))
  }, [])

  const pastel = pastelIndex === null ? null : pastelStyles[pastelIndex]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={[
              'group overflow-hidden rounded-lg border border-[#b6bec6]/65 shadow-[0_8px_24px_rgba(48,56,64,0.08)] transition-all duration-200 ease-out',
              'hover:-translate-y-0.5 hover:border-[#8f9aa5] hover:shadow-[0_14px_32px_rgba(38,46,54,0.16)] hover:ring-1 hover:ring-[#7f8a94]/35',
              'dark:border-white/5 dark:bg-[#292d30] dark:hover:border-white/15 dark:hover:bg-[#353a3e] dark:hover:ring-white/10',
              pastel?.card || 'bg-[#d6dce2] hover:bg-[#c2ccd5]',
            ].join(' ')}
          >
            <Link
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <CardHeader className="p-4 sm:p-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  {item.icon && (
                    <div
                      className={[
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg p-2',
                        'ring-1 ring-[#9aa4ad]/35 transition-colors duration-200 group-hover:bg-[#eef1f3]/80',
                        'dark:bg-[#202427] dark:ring-white/5 dark:group-hover:bg-[#24282b] sm:h-11 sm:w-11',
                        pastel?.icon || 'bg-[#c9d1d8]',
                      ].join(' ')}
                    >
                      <img
                        src={item.icon}
                        alt={`${item.title} icon`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="truncate text-sm font-medium leading-tight text-[#20262c] transition-colors duration-200 group-hover:text-[#0f1418] sm:text-base">
                      {item.title}
                    </CardTitle>
                    {item.description && (
                      <CardDescription className="line-clamp-1 text-xs leading-relaxed text-[#59636d] sm:text-sm">
                        {item.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Link>
          </Card>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="center"
          sideOffset={8}
          className="max-w-[280px] text-xs sm:text-sm"
        >
          <p>{item.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
