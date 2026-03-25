import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from '@/components/ui/card';

interface StatCardProps {
    title: string;
    value: number | string;
    description?: string;
    icon: React.ReactNode;
    color?: string;
}

export function StatCard({
    title,
    value,
    description,
    icon,
    color,
}: StatCardProps) {
    return (
        <Card
            className="flex flex-col gap-0.5 rounded-md"
            style={{ borderColor: color ? `${color}40` : 'var(--border)' }}
        >
            <CardHeader className="flex flex-row items-center justify-between gap-1.5 space-y-0 px-2.5 pt-0 pb-0">
                <CardTitle className="text-md min-w-0 leading-tight font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div
                    className="shrink-0 rounded p-1"
                    style={{
                        background: color ? `${color}18` : 'var(--muted)',
                        color: color ?? 'var(--muted-foreground)',
                    }}
                >
                    <span className="block [&>svg]:h-5 [&>svg]:w-5">
                        {icon}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-0 px-2.5 pt-0 pb-0">
                <p className="truncate text-xl font-bold text-card-foreground tabular-nums">
                    {value}
                </p>
                {description && (
                    <CardDescription className="text-md truncate leading-snug text-muted-foreground">
                        {description}
                    </CardDescription>
                )}
            </CardContent>
        </Card>
    );
}
