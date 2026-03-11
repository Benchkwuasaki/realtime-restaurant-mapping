import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from '@/components/ui/card';

interface StatCardProps {
    title: string;
    value: number;
    description?: string;
    icon: React.ReactNode;
}

export function StatCard({ title, value, description, icon }: StatCardProps) {
    return (
        <Card className="border-secondary flex flex-col gap-2 border">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="bg-muted text-muted-foreground rounded-lg">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
                <p className="text-2xl font-bold sm:text-3xl">{value}</p>
                {description && (
                    <CardDescription className="text-xs sm:text-sm">
                        {description}
                    </CardDescription>
                )}
            </CardContent>
        </Card>
    );
}
