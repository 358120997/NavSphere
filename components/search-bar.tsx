'use client'

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
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
import { cn } from '@/lib/utils'

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
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const submitSearch = (value: string) => {
    const keyword = value.trim()
    if (!keyword) {
      inputRef.current?.focus()
      return
    }

    setIsSuggestionsOpen(false)
    window.open(SEARCH_ENGINES[engine].buildUrl(keyword), '_blank', 'noopener,noreferrer')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitSearch(activeIndex >= 0 ? suggestions[activeIndex] : query)
  }

  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    setActiveIndex(-1)
    setIsSuggestionsOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsSuggestionsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (!isSuggestionsOpen || suggestions.length === 0) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % suggestions.length)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
    }
  }

  useEffect(() => {
    const keyword = query.trim()
    if (!keyword) {
      setSuggestions([])
      setIsSuggestionsOpen(false)
      setActiveIndex(-1)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsFetchingSuggestions(true)

      try {
        const response = await fetch(
          `/api/search-suggestions?engine=${engine}&q=${encodeURIComponent(keyword)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('suggestions failed')
        }

        const data = await response.json()
        const nextSuggestions = Array.isArray(data.suggestions) ? data.suggestions : []
        setSuggestions(nextSuggestions)
        setIsSuggestionsOpen(nextSuggestions.length > 0)
        setActiveIndex(-1)
      } catch (error) {
        if (!controller.signal.aborted) {
          setSuggestions([])
          setIsSuggestionsOpen(false)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingSuggestions(false)
        }
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [engine, query])

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          ref={inputRef}
          placeholder="搜索网页"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsSuggestionsOpen(suggestions.length > 0)}
          onKeyDown={handleKeyDown}
          className="h-10 rounded-lg border-slate-200 bg-white pl-10 pr-20 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-sky-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-sky-100"
          aria-label="搜索网页"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 rounded-md p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              aria-label="清空搜索"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-md p-0 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
            aria-label="搜索"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {isSuggestionsOpen && (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-sky-50 hover:text-slate-950',
                  activeIndex === index && 'bg-sky-50 text-slate-950'
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery(suggestion)
                  submitSearch(suggestion)
                }}
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-foreground/40" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
            {isFetchingSuggestions && (
              <div className="px-3 py-2 text-xs text-muted-foreground">正在获取联想词...</div>
            )}
          </div>
        )}
      </div>

      <Select
        value={engine}
        onValueChange={(value) => {
          setEngine(value as SearchEngine)
          setSuggestions([])
          setIsSuggestionsOpen(false)
        }}
      >
        <SelectTrigger className="h-10 w-[86px] rounded-lg border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 focus:ring-2 focus:ring-sky-100 sm:w-[104px]" aria-label="选择搜索引擎">
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
