import { AuthInertiaUser } from "@/types/auth-inertia-user";
import { usePage } from "@inertiajs/react";

export function useAuth() {
    const pageProps = usePage().props as unknown as { auth?: { user: AuthInertiaUser | null } };
    const user = pageProps.auth?.user ?? null;

    const hasRole = (role: string) => user?.roles.includes(role) ?? false;
    const role = user?.roles?.[0]
        ? {
            value: user.roles[0],
            label: user.roles[0]
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase()),
        }
        : null;


    return { user, isLoggedIn: !!user, hasRole, role };
}
