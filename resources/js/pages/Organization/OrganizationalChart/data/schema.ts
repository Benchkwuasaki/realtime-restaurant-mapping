export interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    dateHired: string;
    profilePicture: string;
}

export interface Unit {
    id: number;
    name: string;
    acronym?: string;
    description?: string;
    positions?: Position[];
}

export interface Position {
    id: number;
    name: string;
    employees: Employee[];
}

export interface Division {
    id: number;
    name: string;
    acronym: string;
    description: string;
    units: Unit[];
    positions: Position[];
}

export interface Department {
    id: number;
    name: string;
    acronym: string;
    description: string;
    divisions: Division[];
    topPositions: Position[];
}
