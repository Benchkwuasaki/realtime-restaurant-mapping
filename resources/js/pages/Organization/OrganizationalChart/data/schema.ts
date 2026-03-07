export interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    dateHired: string;
    avatarUrl?: string | null;   // maps to avatar_url on the employees table
    avatarPath?: string | null;  // maps to avatar_path on the employees table
}

export interface Position {
    id: number;
    name: string;
    employees: Employee[];
}

export interface Unit {
    id: number;
    name: string;
    acronym?: string;
    positions?: Position[];
}

export interface Division {
    id: number;
    name: string;
    acronym: string;
    description?: string;
    units: Unit[];
    positions: Position[];
}

export interface Department {
    id: number;
    name: string;
    acronym: string;
    description?: string;
    divisions: Division[];
    topPositions: Position[];
}