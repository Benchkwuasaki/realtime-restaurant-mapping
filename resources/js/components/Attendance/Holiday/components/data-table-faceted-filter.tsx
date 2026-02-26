"use client"

import { type Column } from "@tanstack/react-table"
import { Check, PlusCircle } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: {
    label: string
    value: string | boolean
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues()
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set())

  const handleSelect = (option: { value: string | boolean }) => {
    const key = String(option.value)
    setSelectedKeys((prev) => {
      const updated = new Set(prev)
      if (updated.has(key)) {
        updated.delete(key)
      } else {
        updated.add(key)
      }

      const filterValues = options
        .filter((o) => updated.has(String(o.value)))
        .map((o) => o.value)

      column?.setFilterValue(filterValues.length ? filterValues : undefined)
      return updated
    })
  }

  const handleClear = () => {
    setSelectedKeys(new Set())
    column?.setFilterValue(undefined)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle />
          {title}
          {selectedKeys.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedKeys.size}
              </Badge>
              <div className="hidden gap-1 lg:flex">
                {selectedKeys.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedKeys.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((o) => selectedKeys.has(String(o.value)))
                    .map((o) => (
                      <Badge
                        variant="secondary"
                        key={String(o.value)}
                        className="rounded-sm px-1 font-normal"
                      >
                        {o.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        {options.map((option) => {
          const key = String(option.value)
          const isSelected = selectedKeys.has(key)
          const count = facets?.get(option.value)
          return (
            <DropdownMenuItem
              key={key}
              onSelect={(e) => {
                e.preventDefault()
                handleSelect(option)
              }}
              className="flex items-center gap-2"
            >
              <div
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-input"
                )}
              >
                {isSelected && <Check className="size-3 stroke-primary-foreground" />}
              </div>
              {option.icon && (
                <option.icon className="text-muted-foreground size-4" />
              )}
              <span className="text-sm">{option.label}</span>
              {count !== undefined && (
                <span className="text-muted-foreground ml-auto font-mono text-xs">
                  {count}
                </span>
              )}
            </DropdownMenuItem>
          )
        })}
        {selectedKeys.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleClear}
              className="justify-center text-center"
            >
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}