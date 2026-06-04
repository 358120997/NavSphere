'use client'

import { FormEvent, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/registry/new-york/ui/button'
import { Input } from '@/registry/new-york/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/new-york/ui/select'

type SearchEngine = 'baidu' | 'bing'

const SEARCH_ENGINES: Record<SearchEngine, { label: string; buildUrl: (query: string) => string }> = {
  baidu: {
    label: '百度',
    buildUrl: (query) => `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
  },
  bing: {
    label: 'Bing',
    buildUrl: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  },
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [engine, setEngine] = useState<SearchEngine>('baidu')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const keyword = query.trim()
    if (!keyword) {
      inputRef.current?.focus()
      return
    }

    window.open(SEARCH_ENGINES[engine].buildUrl(keyword), '_blank', 'noopener,noreferrer')
  }

  const clearSearch = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" />
        <Input
          ref={inputRef}
          placeholder="搜索网页"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 rounded-lg border-black/5 bg-[#f8f9fa] pl-10 pr-20 shadow-sm transition-colors placeholder:text-foreground/40 focus-visible:bg-white/90 dark:border-white/5 dark:bg-[#292d30] dark:focus-visible:bg-[#303438]"
          aria-label="搜索网页"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 rounded-md p-0 text-foreground/50 hover:bg-black/5 hover:text-foreground"
              aria-label="清空搜索"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-md p-0 text-foreground/60 hover:bg-black/5 hover:text-foreground"
            aria-label="搜索"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Select value={engine} onValueChange={(value) => setEngine(value as SearchEngine)}>
        <SelectTrigger className="h-10 w-[86px] rounded-lg border-black/5 bg-[#f8f9fa] text-foreground/75 shadow-sm dark:border-white/5 dark:bg-[#292d30] sm:w-[104px]" aria-label="选择搜索引擎">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {Object.entries(SEARCH_ENGINES).map(([value, config]) => (
            <SelectItem key={value} value={value}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  )
}
