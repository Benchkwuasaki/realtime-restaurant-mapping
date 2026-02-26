import { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
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
import AppLayout from "@/layouts/app-layout";
import { route } from "ziggy-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SortDirection = "asc" | "desc" | null;
type SortField = "name" | "head" | "description" | "employees" | null;

interface Department {
  department_id: number;
  department_name: string;
  department_acronym: string;
  department_description: string;
}

interface Props {
  departments: Department[];
}

interface BreadcrumbItem {
  title: string;
  href: string;
}

const ROWS_OPTIONS = [10, 25, 50];

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Organization", href: "#" },
  { title: "Departments", href: "/organization/departments" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

// ─── Department Modal ─────────────────────────────────────────────────────────

interface DepartmentModalProps {
  open: boolean;
  editingDepartment: Department | null;
  onClose: () => void;
}

function DepartmentModal({
  open,
  editingDepartment,
  onClose,
}: DepartmentModalProps) {
  const isEdit = editingDepartment !== null;

  const { data, setData, post, put, processing, errors, reset } = useForm({
    department_name: editingDepartment?.department_name ?? "",
    department_acronym: editingDepartment?.department_acronym ?? "",
    department_description: editingDepartment?.department_description ?? "",
  });

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) {
      put(
        route("department.update", editingDepartment!.department_id),
        { onSuccess: handleClose }
      );
    } else {
      post(route("department.store"), { onSuccess: handleClose });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) handleClose();
    }}>
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-lg">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-gray-200">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span>🏢</span>
            {isEdit ? "Edit Department" : "Create Department"}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-5 space-y-4">
            {/* Department Name + Acronym */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="department_name"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Department Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="department_name"
                  value={data.department_name}
                  onChange={(e) => setData("department_name", e.target.value)}
                  placeholder="e.g. Human Resources"
                  className="text-sm"
                />
                <FieldError message={errors.department_name} />
              </div>
              <div>
                <label
                  htmlFor="department_acronym"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  Acronym <span className="text-red-500">*</span>
                </label>
                <Input
                  id="department_acronym"
                  value={data.department_acronym}
                  onChange={(e) =>
                    setData("department_acronym", e.target.value.toUpperCase())
                  }
                  placeholder="e.g. HR"
                  className="text-sm font-mono"
                  maxLength={10}
                />
                <FieldError message={errors.department_acronym} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="department_description"
                className="block text-xs font-medium text-gray-700 mb-1.5"
              >
                Description
              </label>
              <Textarea
                id="department_description"
                value={data.department_description ?? ""}
                onChange={(e) =>
                  setData("department_description", e.target.value)
                }
                placeholder="Optional description of this department's responsibilities..."
                rows={3}
                className="text-sm resize-none"
              />
              <FieldError message={errors.department_description} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={processing}
              className="text-xs"
            >
              {isEdit ? "Update" : "Create"} Department
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: string;
  sortField: SortField;
  sortDir: SortDirection;
}) {
  const active = sortField === field;
  return (
    <span className="inline-flex flex-col ml-1 opacity-60">
      <ChevronUp
        size={10}
        className={active && sortDir === "asc" ? "opacity-100 text-indigo-600" : ""}
      />
      <ChevronDown
        size={10}
        className={
          active && sortDir === "desc" ? "opacity-100 text-indigo-600" : ""
        }
      />
    </span>
  );
}

export default function DepartmentIndex({ departments }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  function openCreate() {
    setEditingDepartment(null);
    setModalOpen(true);
  }

  function openEdit(department: Department) {
    setEditingDepartment(department);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingDepartment(null);
  }

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
      d.department_name.toLowerCase().includes(search.toLowerCase()) ||
      d.department_acronym.toLowerCase().includes(search.toLowerCase()) ||
      d.department_description.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField || !sortDir) return 0;

    let aVal: string | number =
      sortField === "head"
        ? a.department_acronym
        : sortField === "employees"
          ? 0
          : sortField === "description"
            ? a.department_description
            : a.department_name;
    let bVal: string | number =
      sortField === "head"
        ? b.department_acronym
        : sortField === "employees"
          ? 0
          : sortField === "description"
            ? b.department_description
            : b.department_name;

    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const paginated = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const allSelected =
    paginated.length > 0 && paginated.every((d) => selected.has(d.department_id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) paginated.forEach((d) => next.delete(d.department_id));
    else paginated.forEach((d) => next.add(d.department_id));
    setSelected(next);
  };
  const toggleOne = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const thClass =
    "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap";
  const tdClass = "px-4 py-3 text-sm text-gray-700";

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Departments" />

      <div className="flex flex-col gap-4 p-6 bg-gray-50 min-h-screen font-sans">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🏢</span> Departments
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length} department{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="ml-auto">
            <button 
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
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
              <th
                  className={thClass}
                  onClick={() => handleSort("name")}
                >
                  Department Name{" "}
                  <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                </th>
                <th
                  className={thClass}
                  onClick={() => handleSort("head")}
                >
                  Department Head{" "}
                  <SortIcon field="head" sortField={sortField} sortDir={sortDir} />
                </th>
                <th
                  className={thClass}
                  onClick={() => handleSort("description")}
                >
                  Description{" "}
                  <SortIcon
                    field="description"
                    sortField={sortField}
                    sortDir={sortDir}
                  />
                </th>
                <th
                  className={thClass}
                  onClick={() => handleSort("employees")}
                >
                  No. of Employees{" "}
                  <SortIcon field="employees" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    No departments found.
                  </td>
                </tr>
              ) : (
                paginated.map((dept) => (
                  <tr key={dept.department_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selected.has(dept.department_id)}
                        onChange={() => toggleOne(dept.department_id)}
                        className="rounded border-gray-300 accent-indigo-600"
                      />
                    </td>
                    <td className={`${tdClass} font-medium text-gray-900`}>
                      {dept.department_name}
                    </td>
                    <td className={tdClass}>-</td>
                    <td className={`${tdClass} text-gray-500`}>
                      {dept.department_description}
                    </td>
                    <td className={tdClass}>-</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEdit(dept)}
                          className="p-1.5 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
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
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white focus:outline-none"
                >
                  {ROWS_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <DepartmentModal
        open={modalOpen}
        editingDepartment={editingDepartment}
        onClose={closeModal}
      />
    </AppLayout>
  );
}
