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
        <Card className="flex flex-col gap-2" style={{ borderColor: color ? `${color}40` : "var(--border)" }}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="rounded-lg" style={{
                    background: color ? `${color}18` : "var(--muted)",
                    color: color ?? "var(--muted-foreground)",
                }}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
                <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{value}</p>
                {description && (
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground">{description}</CardDescription>
                )}
            </CardContent>
        </Card>
    )
}