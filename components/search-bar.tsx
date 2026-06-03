'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
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
    label: 'Baidu',
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        inputRef.current?.blur()
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const keyword = query.trim()
    if (!keyword) {
      inputRef.current?.focus()
      return
    }

    window.location.href = SEARCH_ENGINES[engine].buildUrl(keyword)
  }

  const clearSearch = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={`Search with ${SEARCH_ENGINES[engine].label}...`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 rounded-lg border pl-10 pr-16 shadow-sm"
          aria-label="Search keywords"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0 hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <kbd className="hidden h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground sm:flex">
            Ctrl K
          </kbd>
        </div>
      </div>

      <Select value={engine} onValueChange={(value) => setEngine(value as SearchEngine)}>
        <SelectTrigger className="h-10 w-[86px] rounded-lg shadow-sm sm:w-[104px]" aria-label="Select search engine">
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

      <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-lg" aria-label="Search">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
}
