import { useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

type SortDirection = "asc" | "desc" | null;
type SortField = "name" | "head" | "description" | "employees" | null;

interface Department {
  id: number;
  name: string;
  head: string;
  description: string;
  employees: number;
}

const initialDepartments: Department[] = [
  { id: 1, name: "Human Resources", head: "Alice Johnson", description: "Manages employee relations and recruitment.", employees: 12 },
  { id: 2, name: "Information Technology", head: "Bob Martinez", description: "Develops and maintains internal software systems.", employees: 20 },
  { id: 3, name: "Finance", head: "Carol White", description: "Handles budgeting, accounting, and financial reporting.", employees: 8 },
  { id: 4, name: "Operations", head: "David Lee", description: "Oversees daily operational activities.", employees: 15 },
  { id: 5, name: "Legal", head: "Eva Brown", description: "Provides legal counsel and ensures compliance.", employees: 5 },
  { id: 6, name: "Marketing", head: "Frank Davis", description: "Manages brand, communications, and public relations.", employees: 10 },
];

const ROWS_OPTIONS = [10, 25, 50];

function SortIcon({ field, sortField, sortDir }: { field: string; sortField: SortField; sortDir: SortDirection }) {
  const active = sortField === field;
  return (
    <span className="inline-flex flex-col ml-1 opacity-60">
      <ChevronUp size={10} className={active && sortDir === "asc" ? "opacity-100 text-indigo-600" : ""} />
      <ChevronDown size={10} className={active && sortDir === "desc" ? "opacity-100 text-indigo-600" : ""} />
    </span>
  );
}

export default function Departments() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [departments] = useState<Department[]>(initialDepartments);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortField(null);
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.head.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField || !sortDir) return 0;
    let aVal: string | number = a[sortField === "employees" ? "employees" : sortField === "head" ? "head" : sortField === "description" ? "description" : "name"];
    let bVal: string | number = b[sortField === "employees" ? "employees" : sortField === "head" ? "head" : sortField === "description" ? "description" : "name"];
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const paginated = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const allSelected = paginated.length > 0 && paginated.every((d) => selected.has(d.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) paginated.forEach((d) => next.delete(d.id));
    else paginated.forEach((d) => next.add(d.id));
    setSelected(next);
  };
  const toggleOne = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap";
  const tdClass = "px-4 py-3 text-sm text-gray-700";

  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-50 min-h-screen font-sans">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 flex items-center gap-1">
        <span>Organization</span>
        <span>›</span>
        <span className="text-gray-700 font-medium">Departments</span>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>🏢</span> Departments
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{filtered.length} department{filtered.length !== 1 ? "s" : ""} found</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="ml-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={15} />
            Create Department
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 accent-indigo-600"
                />
              </th>
              <th className={thClass} onClick={() => handleSort("name")}>
                Department Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className={thClass} onClick={() => handleSort("head")}>
                Department Head <SortIcon field="head" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className={thClass} onClick={() => handleSort("description")}>
                Description <SortIcon field="description" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className={thClass} onClick={() => handleSort("employees")}>
                No. of Employees <SortIcon field="employees" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No departments found.</td>
              </tr>
            ) : (
              paginated.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.has(dept.id)}
                      onChange={() => toggleOne(dept.id)}
                      className="rounded border-gray-300 accent-indigo-600"
                    />
                  </td>
                  <td className={`${tdClass} font-medium text-gray-900`}>{dept.name}</td>
                  <td className={tdClass}>{dept.head}</td>
                  <td className={`${tdClass} text-gray-500`}>{dept.description}</td>
                  <td className={tdClass}>{dept.employees}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 flex-wrap gap-2">
          <span className="text-xs text-gray-400">
            {selected.size} of {filtered.length} row(s) selected.
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Rows per page</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white focus:outline-none"
              >
                {ROWS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                <ChevronsLeft size={14} />z
              </button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                <ChevronRight size={14} />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}