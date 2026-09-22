'use client'

import Link from 'next/link'
import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
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
  canManage?: boolean
  isDragging?: boolean
  dragRootProps?: HTMLAttributes<HTMLDivElement>
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>
  onEdit?: (item: NavigationSubItem) => void
  onDelete?: (item: NavigationSubItem) => void
}

export function NavigationCard({
  item,
  canManage = false,
  isDragging = false,
  dragRootProps,
  dragHandleProps,
  onEdit,
  onDelete,
}: NavigationCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            {...dragRootProps}
            className={[
              'group relative min-h-[92px] overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out',
              'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white',
              'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_32px_rgba(15,23,42,0.10)]',
              canManage ? 'cursor-grab select-none active:cursor-grabbing' : '',
              isDragging ? 'scale-[1.02] border-sky-300 shadow-[0_20px_45px_rgba(14,116,144,0.20)] ring-2 ring-sky-200' : '',
            ].join(' ')}
          >
            {canManage && (
              <div className="absolute right-2 top-2 z-20 flex items-center gap-1 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  type="button"
                  className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-white/95 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-sky-50 hover:text-sky-700 active:cursor-grabbing"
                  aria-label={`拖动 ${item.title}`}
                  {...dragHandleProps}
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-950"
                  aria-label={`编辑 ${item.title}`}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onEdit?.(item)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-red-600 shadow-sm ring-1 ring-red-100 transition hover:bg-red-50 hover:text-red-700"
                  aria-label={`删除 ${item.title}`}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onDelete?.(item)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <Link
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                if (canManage) {
                  event.preventDefault()
                }
              }}
              className="relative z-10 block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <CardHeader className="p-4 sm:p-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  {item.icon && (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200 transition-colors duration-200 group-hover:bg-sky-50 group-hover:ring-sky-100 sm:h-11 sm:w-11">
                      <img
                        src={item.icon}
                        alt={`${item.title} icon`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="truncate text-sm font-semibold leading-tight text-slate-900 transition-colors duration-200 sm:text-base">
                      {item.title}
                    </CardTitle>
                    {item.description && (
                      <CardDescription className="line-clamp-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
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
