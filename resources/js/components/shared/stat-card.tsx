import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"

interface StatCardProps {
    title: string
    value: number | string
    description?: string
    icon: React.ReactNode
    color?: string
}

export function StatCard({ title, value, description, icon, color }: StatCardProps) {
    return (
        <Card className="flex flex-col gap-2 rounded-lg" style={{ borderColor: color ? `${color}40` : "var(--border)" }}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-1.5">
                <CardTitle className="min-w-0 text-xs font-medium leading-tight text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="shrink-0 rounded-lg p-1.5" style={{
                    background: color ? `${color}18` : "var(--muted)",
                    color: color ?? "var(--muted-foreground)",
                }}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
                <p className="text-lg font-bold text-card-foreground sm:text-3xl">{value}</p>
                {description && (
                    <CardDescription className="truncate text-xs text-muted-foreground sm:text-sm">
                        {description}
                    </CardDescription>
                )}
            </CardContent>
        </Card>
    )
}