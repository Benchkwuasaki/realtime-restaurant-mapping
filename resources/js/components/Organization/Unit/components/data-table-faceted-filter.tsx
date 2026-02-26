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
        value: string
    }[]
}

export function DataTableFacetedFilter<TData, TValue>({
    column,
    title,
    options,
}: DataTableFacetedFilterProps<TData, TValue>) {
    const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set())

    const handleSelect = (value: string) => {
        setSelectedKeys((prev) => {
            const updated = new Set(prev)
            if (updated.has(value)) {
                updated.delete(value)
            } else {
                updated.add(value)
            }
            const filterValues = options
                .filter((o) => updated.has(o.value))
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
                                        .filter((o) => selectedKeys.has(o.value))
                                        .map((o) => (
                                            <Badge
                                                variant="secondary"
                                                key={o.value}
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
            <DropdownMenuContent align="start" className="w-55">
                {options.map((option) => {
                    const isSelected = selectedKeys.has(option.value)
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
                                    "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                                    isSelected
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-input"
                                )}
                            >
                                {isSelected && <Check className="size-3 stroke-primary-foreground" />}
                            </div>
                            <span className="text-sm">{option.label}</span>
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