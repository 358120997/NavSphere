import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/registry/new-york/ui/card'
import type { NavigationSubItem } from '@/types/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavigationCardProps {
  item: NavigationSubItem
}

export function NavigationCard({ item }: NavigationCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="group overflow-hidden rounded-lg border-black/5 bg-[#f8f9fa] shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-black/15 hover:bg-[#e2e7eb] hover:shadow-md hover:ring-1 hover:ring-black/10 dark:border-white/5 dark:bg-[#292d30] dark:hover:border-white/15 dark:hover:bg-[#353a3e] dark:hover:ring-white/10">
            <Link
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <CardHeader className="p-4 sm:p-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  {item.icon && (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#eef1f3] p-2 ring-1 ring-black/5 transition-colors duration-200 group-hover:bg-white/80 dark:bg-[#202427] dark:ring-white/5 dark:group-hover:bg-[#24282b] sm:h-11 sm:w-11">
                      <img
                        src={item.icon}
                        alt={`${item.title} icon`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="truncate text-sm font-medium leading-tight text-foreground/85 transition-colors duration-200 group-hover:text-foreground sm:text-base">
                      {item.title}
                    </CardTitle>
                    {item.description && (
                      <CardDescription className="line-clamp-1 text-xs leading-relaxed text-foreground/50 sm:text-sm">
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
