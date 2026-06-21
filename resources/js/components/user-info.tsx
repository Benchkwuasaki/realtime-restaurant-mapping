import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useInitials } from '@/hooks/use-initials';
import { AuthInertiaUser } from '@/types/auth-inertia-user';
import { useEffect, useRef, useState } from 'react';

function useTruncated<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const check = () => setIsTruncated(el.scrollWidth > el.clientWidth);
        check();

        const observer = new ResizeObserver(check);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { ref, isTruncated };
}

export function UserInfo({
    user,
    showRole = true,
}: {
    user: AuthInertiaUser;
    showRole?: boolean;
}) {
    const getInitials = useInitials();
    const { roles } = useAuth();
    const rolesText = roles.map((r) => r.label).join(', ');

    const { ref: nameRef, isTruncated: isNameTruncated } = useTruncated<HTMLSpanElement>();
    const { ref: positionRef, isTruncated: isPositionTruncated } = useTruncated<HTMLSpanElement>();

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full flex-shrink-0">
                <AvatarImage src={user.avatar_url} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0 flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1 min-w-0">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild disabled={!isNameTruncated}>
                                <span ref={nameRef} className="truncate font-medium">
                                    {user.name}
                                </span>
                            </TooltipTrigger>
                            {isNameTruncated && (
                                <TooltipContent>
                                    <p>{user.name}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>

                    {showRole && roles.length > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-default text-[9px] font-semibold leading-none flex-shrink-0 transition-colors">
                                        R
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{rolesText}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild disabled={!isPositionTruncated}>
                            <span ref={positionRef} className="truncate text-xs text-muted-foreground">
                                {user.position}
                            </span>
                        </TooltipTrigger>
                        {isPositionTruncated && (
                            <TooltipContent>
                                <p>{user.position}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </div>
        </>
    );
}
