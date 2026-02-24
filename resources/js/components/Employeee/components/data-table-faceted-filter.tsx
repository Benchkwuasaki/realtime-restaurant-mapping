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
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues()

  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set((column?.getFilterValue() as string[]) ?? [])
  )

  const handleSelect = (value: string) => {
    setSelected((prev) => {
      const updated = new Set(prev)
      if (updated.has(value)) {
        updated.delete(value)
      } else {
        updated.add(value)
      }
      const filterValues = Array.from(updated)
      column?.setFilterValue(filterValues.length ? filterValues : undefined)
      return updated
    })
  }

  const handleClear = () => {
    setSelected(new Set())
    column?.setFilterValue(undefined)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle />
          {title}
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selected.size}
              </Badge>
              <div className="hidden gap-1 lg:flex">
                {selected.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selected.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selected.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {options.map((option) => {
          const isSelected = selected.has(option.value)
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={(e) => {
                e.preventDefault()
                handleSelect(option.value)
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
              <span>{option.label}</span>
              {facets?.get(option.value) && (
                <span className="text-muted-foreground ml-auto font-mono text-xs">
                  {facets.get(option.value)}
                </span>
              )}
            </DropdownMenuItem>
          )
        })}
        {selected.size > 0 && (
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