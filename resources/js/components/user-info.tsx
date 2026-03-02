import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useInitials } from '@/hooks/use-initials';
import { AuthInertiaUser } from '@/types/auth-inertia-user';

export function UserInfo({
    user,
    showRole = true,
}: {
    user: AuthInertiaUser;
    showRole?: boolean;
}) {
    const getInitials = useInitials();
    const { role } = useAuth()

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showRole && (
                    <span className="truncate text-xs text-muted-foreground">
                        {role?.label}
                    </span>
                )}
            </div>
        </>
    );
}
