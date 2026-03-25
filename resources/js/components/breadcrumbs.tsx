import { Link } from '@inertiajs/react';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Slot =
    | { kind: 'item'; item: BreadcrumbItemType; index: number }
    | { kind: 'ellipsis'; items: BreadcrumbItemType[] }

// ─── Component ────────────────────────────────────────────────────────────────

export function Breadcrumbs({ breadcrumbs }: { breadcrumbs: BreadcrumbItemType[] }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLLIElement | null)[]>([])
    const sepRefs = useRef<(HTMLLIElement | null)[]>([])

    // Indices of the middle items currently collapsed into the ellipsis.
    // null = show everything.
    const [collapsedRange, setCollapsedRange] = useState<[number, number] | null>(null)

    const compute = () => {
        const container = containerRef.current
        if (!container || breadcrumbs.length <= 2) {
            setCollapsedRange(null)
            return
        }

        const available = container.offsetWidth
        const threshold = available * 0.75
        const n = breadcrumbs.length

        const iW = itemRefs.current.map((el) => el?.offsetWidth ?? 0)
        const sW = sepRefs.current.map((el) => el?.offsetWidth ?? 0)

        const fullWidth = iW.reduce((a, b) => a + b, 0) + sW.reduce((a, b) => a + b, 0)

        // No overflow — show everything
        if (fullWidth <= threshold) {
            setCollapsedRange(null)
            return
        }

        const ellipsisW = 36

        // Try collapseEnd from 1 upward (most visible → least visible).
        // collapseEnd is the last index hidden in the ellipsis.
        // Visible: [0] + ellipsis + [collapseEnd+1 .. n-1]
        for (let collapseEnd = 1; collapseEnd <= n - 2; collapseEnd++) {
            let width =
                iW[0] + (sW[0] ?? 0) +                    // first + sep
                ellipsisW + (sW[collapseEnd] ?? 0)         // ellipsis + sep after ellipsis

            for (let j = collapseEnd + 1; j < n; j++) {
                width += iW[j]
                if (j < n - 1) width += sW[j]             // sep after j (skip after last)
            }

            if (width <= threshold) {
                setCollapsedRange([1, collapseEnd])
                return
            }
        }

        // Nothing fits even with max collapse — hide all middle
        setCollapsedRange([1, n - 2])
    }

    useLayoutEffect(() => {
        compute()
    }, [breadcrumbs])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(() => compute())
        ro.observe(el)
        return () => ro.disconnect()
    }, [breadcrumbs])

    if (breadcrumbs.length === 0) return null

    const n = breadcrumbs.length
    const [colStart, colEnd] = collapsedRange ?? [-1, -1]

    // Build flat slot list
    const slots: Slot[] = []
    let i = 0
    while (i < n) {
        if (collapsedRange && i === colStart) {
            slots.push({ kind: 'ellipsis', items: breadcrumbs.slice(colStart, colEnd + 1) })
            i = colEnd + 1
        } else {
            slots.push({ kind: 'item', item: breadcrumbs[i], index: i })
            i++
        }
    }

    return (
        <div ref={containerRef} className="min-w-0 flex-1 overflow-hidden">
            <Breadcrumb>
                {/* ── Hidden row used only for measuring natural item widths ── */}
                <BreadcrumbList
                    aria-hidden="true"
                    className="pointer-events-none invisible absolute whitespace-nowrap"
                >
                    {breadcrumbs.map((item, idx) => {
                        const isLast = idx === n - 1
                        return (
                            <Fragment key={idx}>
                                <BreadcrumbItem ref={(el) => { itemRefs.current[idx] = el }}>
                                    {isLast
                                        ? <BreadcrumbPage>{item.title}</BreadcrumbPage>
                                        : <BreadcrumbLink asChild>
                                            <Link href={item.href}>{item.title}</Link>
                                        </BreadcrumbLink>
                                    }
                                </BreadcrumbItem>
                                {!isLast && (
                                    <BreadcrumbSeparator ref={(el) => { sepRefs.current[idx] = el }} />
                                )}
                            </Fragment>
                        )
                    })}
                </BreadcrumbList>

                {/* ── Visible breadcrumb row ── */}
                <BreadcrumbList className="flex-nowrap overflow-hidden">
                    {slots.map((slot, si) => {
                        const showSep = si > 0

                        if (slot.kind === 'ellipsis') {
                            return (
                                <Fragment key="ellipsis">
                                    {showSep && <BreadcrumbSeparator />}
                                    <BreadcrumbItem>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                className="flex items-center rounded px-1 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                aria-label="Show more breadcrumbs"
                                            >
                                                <BreadcrumbEllipsis />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                {slot.items.map((collapsed, ci) => (
                                                    <DropdownMenuItem key={ci} asChild>
                                                        <Link href={collapsed.href} className="cursor-pointer">
                                                            {collapsed.title}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </BreadcrumbItem>
                                </Fragment>
                            )
                        }

                        const { item, index } = slot
                        const isLast = index === n - 1

                        return (
                            <Fragment key={index}>
                                {showSep && <BreadcrumbSeparator />}
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage className="block max-w-[200px] truncate">
                                            {item.title}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link href={item.href} className="block max-w-[160px] truncate">
                                                {item.title}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </Fragment>
                        )
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    )
}