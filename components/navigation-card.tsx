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
          <Card className="group overflow-hidden rounded-lg border-border/70 bg-card/95 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-accent/30 hover:shadow-md">
            <Link
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <CardHeader className="p-4 sm:p-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  {item.icon && (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted/60 p-2 ring-1 ring-border/50 transition-colors duration-200 group-hover:bg-background/80 sm:h-11 sm:w-11">
                      <img
                        src={item.icon}
                        alt={`${item.title} icon`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="truncate text-sm font-medium leading-tight transition-colors duration-200 group-hover:text-primary sm:text-base">
                      {item.title}
                    </CardTitle>
                    {item.description && (
                      <CardDescription className="line-clamp-1 text-xs leading-relaxed text-muted-foreground/85 sm:text-sm">
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
