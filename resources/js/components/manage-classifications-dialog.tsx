import { router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { Plus, Trash2, Save, Pencil } from 'lucide-react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

export interface EmploymentClassification {
    id: number;
    name: string;
    description?: string;
}

export function ManageClassificationsDialog({
    open,
    onClose,
    classifications,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    classifications: EmploymentClassification[];
    onCreated: (name: string) => void;
}) {
    const [addForm, setAddForm] = useState({ name: '', description: '' });
    const [editId, setEditId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '' });
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const openEdit = (c: EmploymentClassification) => {
        setEditId(c.id);
        setEditForm({ name: c.name, description: c.description ?? '' });
    };

    const handleAdd = () => {
        if (!addForm.name.trim()) return;
        setLoading(true);
        const nameToSelect = addForm.name.trim();
        router.post(
            route('employee.employment-classification.store'),
            addForm,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAddForm({ name: '', description: '' });
                    onCreated(nameToSelect);
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const handleUpdate = () => {
        if (!editId || !editForm.name.trim()) return;
        setLoading(true);
        router.put(
            route('employee.employment-classification.update', editId),
            editForm,
            {
                preserveScroll: true,
                onSuccess: () => setEditId(null),
                onFinish: () => setLoading(false),
            },
        );
    };

    const handleDelete = () => {
        if (!deleteId) return;
        setLoading(true);
        router.delete(
            route('employee.employment-classification.destroy', deleteId),
            {
                preserveScroll: true,
                onSuccess: () => setDeleteId(null),
                onFinish: () => setLoading(false),
            },
        );
    };

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Manage Employment Classifications
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                            {classifications.length === 0 ? (
                                <div className="px-5 py-6 text-center text-sm text-muted-foreground italic">
                                    No classifications yet. Add one below.
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {classifications.map((c) => (
                                        <div key={c.id}>
                                            {editId === c.id ? (
                                                <div className="space-y-2 bg-muted/20 px-4 py-3">
                                                    <div>
                                                        <Label className="mb-1.5 block text-xs tracking-widest text-muted-foreground uppercase">
                                                            Name
                                                        </Label>
                                                        <Input
                                                            value={
                                                                editForm.name
                                                            }
                                                            onChange={(e) =>
                                                                setEditForm(
                                                                    (p) => ({
                                                                        ...p,
                                                                        name: e
                                                                            .target
                                                                            .value,
                                                                    }),
                                                                )
                                                            }
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="mb-1.5 block text-xs tracking-widest text-muted-foreground uppercase">
                                                            Description
                                                        </Label>
                                                        <Input
                                                            value={
                                                                editForm.description
                                                            }
                                                            onChange={(e) =>
                                                                setEditForm(
                                                                    (p) => ({
                                                                        ...p,
                                                                        description:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                            placeholder="Optional…"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setEditId(null)
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={
                                                                handleUpdate
                                                            }
                                                            disabled={
                                                                loading ||
                                                                !editForm.name.trim()
                                                            }
                                                        >
                                                            <Save className="mr-1.5 h-3.5 w-3.5" />
                                                            Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/20">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {c.name}
                                                        </p>
                                                        {c.description && (
                                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                                {c.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            onClick={() =>
                                                                openEdit(c)
                                                            }
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() =>
                                                                setDeleteId(
                                                                    c.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-4">
                            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                                Add New Classification
                            </p>
                            <div>
                                <Label className="mb-1.5 block text-xs tracking-widest text-muted-foreground uppercase">
                                    Name *
                                </Label>
                                <Input
                                    value={addForm.name}
                                    onChange={(e) =>
                                        setAddForm((p) => ({
                                            ...p,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Contract of Service"
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && handleAdd()
                                    }
                                />
                            </div>
                            <div>
                                <Label className="mb-1.5 block text-xs tracking-widest text-muted-foreground uppercase">
                                    Description
                                </Label>
                                <Input
                                    value={addForm.description}
                                    onChange={(e) =>
                                        setAddForm((p) => ({
                                            ...p,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Optional description…"
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && handleAdd()
                                    }
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAdd}
                                    disabled={loading || !addForm.name.trim()}
                                    className="gap-1.5"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Classification
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={!!deleteId}
                onOpenChange={(o) => !o && setDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Classification?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Existing employees already assigned will keep their
                            current value.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
