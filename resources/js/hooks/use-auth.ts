import { AuthInertiaUser } from "@/types/auth-inertia-user";
import { usePage } from "@inertiajs/react";

export function useAuth() {
    const pageProps = usePage().props as unknown as { auth?: { user: AuthInertiaUser | null } };
    const user = pageProps.auth?.user ?? null;

    const hasRole = (role: string) => user?.roles.includes(role) ?? false;
    const roles = user?.roles?.map((role) => ({
        value: role,
        label: role
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
    })) ?? [];


    return { user, isLoggedIn: !!user, hasRole, roles };
}
