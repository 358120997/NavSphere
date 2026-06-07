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
    card: 'bg-[#ded3cf] hover:bg-[#cdbbb5]',
    icon: 'bg-[#d1c1bc]',
  },
  {
    card: 'bg-[#d4ded7] hover:bg-[#bed0c5]',
    icon: 'bg-[#c5d2ca]',
  },
  {
    card: 'bg-[#d2dbe3] hover:bg-[#bac9d7]',
    icon: 'bg-[#c2cfda]',
  },
  {
    card: 'bg-[#ded9cc] hover:bg-[#cec4ad]',
    icon: 'bg-[#d2c9b8]',
  },
  {
    card: 'bg-[#d9d4e0] hover:bg-[#c8bdd2]',
    icon: 'bg-[#cbc4d6]',
  },
  {
    card: 'bg-[#d1dfe0] hover:bg-[#b8d0d2]',
    icon: 'bg-[#c0d2d4]',
  },
  {
    card: 'bg-[#e0d4da] hover:bg-[#d0bdc7]',
    icon: 'bg-[#d4c4cb]',
  },
  {
    card: 'bg-[#d6dccf] hover:bg-[#c4d0b8]',
    icon: 'bg-[#c9d2bd]',
  },
  {
    card: 'bg-[#d4d7e2] hover:bg-[#bfc5d8]',
    icon: 'bg-[#c5cad9]',
  },
  {
    card: 'bg-[#e1d5c9] hover:bg-[#d1bfa8]',
    icon: 'bg-[#d5c6b3]',
  },
  {
    card: 'bg-[#d2dfd2] hover:bg-[#bcd1bd]',
    icon: 'bg-[#c3d3c3]',
  },
  {
    card: 'bg-[#d8d2df] hover:bg-[#c5bad2]',
    icon: 'bg-[#cbc3d6]',
  },
  {
    card: 'bg-[#d1dbe0] hover:bg-[#b8cbd3]',
    icon: 'bg-[#c0cfd6]',
  },
  {
    card: 'bg-[#dfd2d2] hover:bg-[#d0bbbb]',
    icon: 'bg-[#d4c1c1]',
  },
  {
    card: 'bg-[#d7ded1] hover:bg-[#c5d2ba]',
    icon: 'bg-[#cad4c1]',
  },
  {
    card: 'bg-[#d3d6dd] hover:bg-[#bec5d1]',
    icon: 'bg-[#c4cad4]',
  },
  {
    card: 'bg-[#ded6ca] hover:bg-[#cec1aa]',
    icon: 'bg-[#d2c7b4]',
  },
  {
    card: 'bg-[#d2dcda] hover:bg-[#bbcfcb]',
    icon: 'bg-[#c1d1ce]',
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
              'group relative overflow-hidden rounded-lg border border-[#9da8b1]/75 shadow-[0_0_0_1px_rgba(255,255,255,0.28)_inset,0_10px_26px_rgba(42,50,58,0.14)] transition-all duration-200 ease-out',
              'hover:-translate-y-1 hover:border-[#6f7c87] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.38)_inset,0_16px_38px_rgba(32,40,48,0.24),0_0_24px_rgba(84,98,112,0.18)] hover:ring-1 hover:ring-[#6f7c87]/45',
              'dark:border-white/5 dark:bg-[#292d30] dark:hover:border-white/15 dark:hover:bg-[#353a3e] dark:hover:ring-white/10',
              pastel?.card || 'bg-[#d4dbe1] hover:bg-[#bdc8d2]',
            ].join(' ')}
          >
            <div className="pointer-events-none absolute inset-0 bg-white/0 transition-colors duration-200 group-hover:bg-white/14" />
            <Link
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
