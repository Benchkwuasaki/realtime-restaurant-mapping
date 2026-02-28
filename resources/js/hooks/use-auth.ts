import { AuthInertiaUser } from "@/types/auth-inertia-user";
import { usePage } from "@inertiajs/react";

export function useAuth() {
    const pageProps = usePage().props as unknown as { auth?: { user: AuthInertiaUser | null } };
    const user = pageProps.auth?.user ?? null;

    const hasRole = (role: string) => user?.roles.includes(role) ?? false;
    // const hasPermission = (perm: string) => user?.permissions.includes(perm) ?? false;

    return { user, isLoggedIn: !!user, hasRole };
}
