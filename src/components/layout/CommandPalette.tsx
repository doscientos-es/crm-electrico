import {
  ArrowRight,
  Building2,
  FileArchive,
  Hash,
  Home,
  Search,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/media/logo.png'
import { appBrand, navItems } from '../../config/nav'
import { useCustomers } from '../../services/customers.service'
import { useDocuments } from '../../services/documents.service'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot } from '../ui/dialog'

type ResultItem = {
  id: string
  category: string
  categoryIcon: React.ElementType
  label: string
  sublabel?: string
  href: string
  icon: React.ElementType
}

function highlight(text: string, query: string) {
  if (!query) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-primary/15 text-primary rounded px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  )
}

const categoryIconMap: Record<string, React.ElementType> = {
  'Páginas': Home,
  'Clientes': Building2,
  'Documentos': FileArchive,
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: customersData } = useCustomers({ pageSize: 200 })
  const { data: documents = [] } = useDocuments()
  const customers = customersData?.data ?? []
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timeout)
  }, [open])

  const handleOpenChange = useCallback((next: boolean) => {
    if (!next) {
      setQuery('')
      setActiveIndex(0)
    }
    onOpenChange(next)
  }, [onOpenChange])

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim().toLowerCase()

    const pages: ResultItem[] = navItems
      .filter((item) => item.enabled !== false && (!q || item.label.toLowerCase().includes(q)))
      .map((item) => ({ id: `nav-${item.href}`, category: 'Páginas', categoryIcon: Home, label: item.label, href: item.href, icon: item.icon }))

    if (!q) return pages

    const cust: ResultItem[] = customers
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.dni?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q),
      )
      .slice(0, 6)
      .map((c) => ({ id: `customer-${c.id}`, category: 'Clientes', categoryIcon: Building2, label: c.name, sublabel: c.company ?? c.email ?? c.city ?? undefined, href: `/customers/${c.id}`, icon: Building2 }))

    const docs: ResultItem[] = documents
      .filter((d) => d.file_name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((d) => ({ id: `doc-${d.id}`, category: 'Documentos', categoryIcon: FileArchive, label: d.file_name, sublabel: d.type, href: '/documents', icon: FileArchive }))

    return [...pages, ...cust, ...docs]
  }, [query, customers, documents])

  const grouped = useMemo(() => {
    const map = new Map<string, ResultItem[]>()
    for (const item of results) {
      const arr = map.get(item.category) ?? []
      arr.push(item)
      map.set(item.category, arr)
    }
    return map
  }, [results])

  const flat = results

  const select = useCallback((item: ResultItem) => {
    navigate(item.href)
    handleOpenChange(false)
  }, [navigate, handleOpenChange])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && flat[activeIndex]) select(flat[activeIndex])
    if (e.key === 'Escape') handleOpenChange(false)
  }

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="animate-fade-in fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm" />
        <DialogContent
          aria-label="Búsqueda global"
          onKeyDown={onKeyDown}
          className="animate-fade-in fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-24px)] max-w-xl -translate-x-1/2 rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
              placeholder="Buscar clientes, documentos, páginas…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:block">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
            {flat.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
                <img src={logo} alt="" className="h-7 w-7 object-contain opacity-30" />
                Sin resultados para «{query}»
              </div>
            ) : (
              Array.from(grouped.entries()).map(([category, items]) => {
                const CatIcon = categoryIconMap[category] ?? Hash
                return (
                  <div key={category} className="mb-1">
                    <div className="flex items-center gap-1.5 px-2 py-1.5">
                      <CatIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{category}</span>
                    </div>
                    {items.map((item) => {
                      const globalIdx = flat.indexOf(item)
                      const isActive = globalIdx === activeIndex
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-index={globalIdx}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          onClick={() => select(item)}
                          className={[
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                            isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                          ].join(' ')}
                        >
                          <div className={['grid h-8 w-8 shrink-0 place-items-center rounded-md', isActive ? 'bg-primary/20' : 'bg-muted'].join(' ')}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{highlight(item.label, query)}</p>
                            {item.sublabel && <p className="truncate text-xs text-muted-foreground">{item.sublabel}</p>}
                          </div>
                          {isActive && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span><kbd className="font-mono">↑↓</kbd> navegar</span>
              <span><kbd className="font-mono">↵</kbd> abrir</span>
            </div>
            <div className="flex items-center gap-1">
              <img src={logo} alt="" className="h-3 w-3 object-contain" />
              <span>{appBrand.name}</span>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  )
}
