export type AuthInertiaUser = {
    id: number;
    employee_id: number;
    name: string;
    email: string;
    position: string;
    roles: string[];
    avatar_url: string;
    notifications?: {
        incoming_documents_count: number
    }
    offices: {
        department: { name: string | null; acronym: string | null } | null
        division: { name: string | null; acronym: string | null } | null
        unit: { name: string | null; acronym: string | null } | null
    } | null
}
