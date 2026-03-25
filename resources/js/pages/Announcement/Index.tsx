import { Head, useForm, usePage } from "@inertiajs/react"
import { useState, useRef, useCallback } from "react"
import { route } from "ziggy-js"
import { format, parseISO } from "date-fns"
import {
    Pin, PinOff, Plus, Pencil, Trash2, Megaphone,
    ShieldAlert, Globe, Building2, Search, X, CheckIcon,
    Bold, Italic, Strikethrough, List, ListOrdered, Quote,
    Heading2, Heading3, Undo2, Redo2, CheckCircle2, Eye,
    Clock, CalendarDays, Underline, Link, Highlighter,
    Palette, Unlink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import AppLayout from "@/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEditor, EditorContent } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { Highlight } from "@tiptap/extension-highlight"
import { Underline as UnderlineExt } from "@tiptap/extension-underline"
import { Link as LinkExt } from "@tiptap/extension-link"
import type { BreadcrumbItem } from "@/types"
import { type Announcement, type Department } from "./data/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    announcements: Announcement[]
    departments: Department[]
}

interface AnnouncementFormData {
    title: string
    body: string
    is_pinned: boolean
    department_ids: number[]
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Announcements", href: route("announcements.index") },
]

// ─── Tiptap extensions ────────────────────────────────────────────────────────

const TIPTAP_EXTENSIONS = [
    StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {},
        blockquote: {},
        bold: {},
        italic: {},
        strike: {},
        code: {},
        codeBlock: {},
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    UnderlineExt,
    LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: "text-primary underline underline-offset-2 cursor-pointer",
            rel: "noopener noreferrer",
            target: "_blank",
        },
    }),
]

// ─── Editor CSS ───────────────────────────────────────────────────────────────

const EDITOR_CLASSNAME = cn(
    "px-3 py-2.5 min-h-[180px]",
    "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[160px]",
    "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
    "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
    "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
    "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
    "[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mt-4 [&_.ProseMirror_h1]:mb-2",
    "[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mt-3 [&_.ProseMirror_h2]:mb-1.5",
    "[&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mt-2.5 [&_.ProseMirror_h3]:mb-1",
    "[&_.ProseMirror_p]:my-1 [&_.ProseMirror_p]:leading-relaxed",
    "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:my-2",
    "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:my-2",
    "[&_.ProseMirror_li]:my-0.5 [&_.ProseMirror_li]:leading-relaxed",
    "[&_.ProseMirror_li_p]:my-0",
    "[&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-border",
    "[&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_blockquote]:my-2",
    "[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:text-xs [&_.ProseMirror_code]:font-mono",
    "[&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:my-2 [&_.ProseMirror_pre]:overflow-x-auto",
    "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-2",
    "[&_.ProseMirror_mark]:rounded-sm [&_.ProseMirror_mark]:px-0.5",
)

// ─── Tiptap toolbar ───────────────────────────────────────────────────────────

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
    const [linkUrl, setLinkUrl] = useState("")
    const [linkOpen, setLinkOpen] = useState(false)
    const colorInputRef = useRef<HTMLInputElement>(null)
    const highlightInputRef = useRef<HTMLInputElement>(null)

    if (!editor) return null

    const currentColor = editor.getAttributes("textStyle").color ?? "#000000"
    const currentHighlight = editor.getAttributes("highlight").color ?? "#fef08a"

    function applyLink() {
        if (!linkUrl.trim()) return
        const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
        setLinkUrl("")
        setLinkOpen(false)
    }

    function removeLink() {
        editor.chain().focus().unsetLink().run()
        setLinkOpen(false)
    }

    return (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/20 rounded-t-md">

            {/* ── Text style ── */}
            <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()} title="Bold" aria-label="Bold">
                <Bold className="w-3.5 h-3.5" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()} title="Italic" aria-label="Italic">
                <Italic className="w-3.5 h-3.5" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive("underline")} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} title="Underline" aria-label="Underline">
                <Underline className="w-3.5 h-3.5" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough" aria-label="Strikethrough">
                <Strikethrough className="w-3.5 h-3.5" />
            </Toggle>

            <Separator orientation="vertical" className="mx-0.5 h-5" />

            {/* ── Color ── */}
            <div className="relative" title="Text color">
                <button
                    type="button"
                    onClick={() => colorInputRef.current?.click()}
                    className={cn(
                        "h-7 w-7 rounded flex items-center justify-center transition-colors hover:bg-accent",
                        "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Palette className="w-3.5 h-3.5" />
                    <span
                        className="absolute bottom-1 left-1 right-1 h-[2.5px] rounded-full"
                        style={{ backgroundColor: currentColor }}
                    />
                </button>
                <input
                    ref={colorInputRef}
                    type="color"
                    value={currentColor}
                    onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                    className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
                    tabIndex={-1}
                />
            </div>

            {/* ── Highlight ── */}
            <div className="relative" title="Highlight color">
                <button
                    type="button"
                    onClick={() => highlightInputRef.current?.click()}
                    className={cn(
                        "h-7 w-7 rounded flex items-center justify-center transition-colors hover:bg-accent",
                        editor.isActive("highlight") ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Highlighter className="w-3.5 h-3.5" />
                    <span
                        className="absolute bottom-1 left-1 right-1 h-[2.5px] rounded-full"
                        style={{ backgroundColor: currentHighlight }}
                    />
                </button>
                <input
                    ref={highlightInputRef}
                    type="color"
                    value={currentHighlight}
                    onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
                    className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
                    tabIndex={-1}
                />
            </div>

            <Separator orientation="vertical" className="mx-0.5 h-5" />

            {/* ── Headings ── */}
            <Toggle size="sm" pressed={editor.isActive("heading", { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2" aria-label="Heading 2">
                <Heading2 className="w-3.5 h-3.5" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive("heading", { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3" aria-label="Heading 3">
                <Heading3 className="w-3.5 h-3.5" />
            </Toggle>

            <Separator orientation="vertical" className="mx-0.5 h-5" />

            {/* ── Lists & blocks ── */}
            <Toggle size="sm" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list" aria-label="Bullet list">
                <List className="w-3.5 h-3.5" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list" aria-label="Ordered list">
                <ListOrdered className="w-3.5 h-3.5" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote" aria-label="Blockquote">
                <Quote className="w-3.5 h-3.5" />
            </Toggle>

            <Separator orientation="vertical" className="mx-0.5 h-5" />

            {/* ── Link ── */}
            <Popover open={linkOpen} onOpenChange={setLinkOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        title="Insert link"
                        className={cn(
                            "h-7 w-7 rounded flex items-center justify-center transition-colors hover:bg-accent",
                            editor.isActive("link") ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Link className="w-3.5 h-3.5" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="start">
                    <p className="text-xs font-medium mb-2">Insert link</p>
                    <div className="flex gap-1.5">
                        <Input
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && applyLink()}
                            placeholder="https://example.com"
                            className="h-8 text-xs"
                            autoFocus
                        />
                        <Button type="button" size="sm" className="h-8 px-2.5 text-xs shrink-0" onClick={applyLink}>
                            Apply
                        </Button>
                    </div>
                    {editor.isActive("link") && (
                        <button
                            type="button"
                            onClick={removeLink}
                            className="mt-2 flex items-center gap-1 text-[11px] text-destructive hover:underline"
                        >
                            <Unlink className="w-3 h-3" /> Remove link
                        </button>
                    )}
                </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="mx-0.5 h-5" />

            {/* ── Undo / Redo ── */}
            <Button
                type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Undo"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
            >
                <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
                type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Redo"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
            >
                <Redo2 className="w-3.5 h-3.5" />
            </Button>
        </div>
    )
}

// ─── Department picker ────────────────────────────────────────────────────────

interface DepartmentPickerProps {
    departments: Department[]
    selectedIds: number[]
    onChange: (ids: number[]) => void
}

function DepartmentPicker({ departments, selectedIds, onChange }: DepartmentPickerProps) {
    const [open, setOpen] = useState(false)

    const toggle = (id: number) => {
        onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id])
    }

    const selectedDepts = departments.filter((d) => selectedIds.includes(d.department_id))
    const isGlobal = selectedIds.length === 0

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
                        <span className="flex items-center gap-2 min-w-0">
                            {isGlobal ? (
                                <><Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-muted-foreground truncate">All departments (global)</span></>
                            ) : (
                                <><Building2 className="w-3.5 h-3.5 text-primary shrink-0" /><span className="font-medium truncate">{selectedIds.length} department{selectedIds.length !== 1 ? "s" : ""} selected</span></>
                            )}
                        </span>
                        <X className={cn("w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ml-2", open ? "rotate-0" : "rotate-45")} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search departments…" />
                        <CommandList>
                            <CommandEmpty>No departments found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem value="__global__" onSelect={() => onChange([])} className="gap-2.5">
                                    <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="font-medium">All departments (no restriction)</span>
                                    {isGlobal && <CheckIcon className="w-3.5 h-3.5 ml-auto text-primary" />}
                                </CommandItem>
                                <Separator className="my-1" />
                                {departments.map((d) => {
                                    const checked = selectedIds.includes(d.department_id)
                                    return (
                                        <CommandItem
                                            key={d.department_id}
                                            value={`${d.department_name} ${d.department_acronym ?? ""}`}
                                            onSelect={() => toggle(d.department_id)}
                                            className="gap-2.5"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="font-medium truncate block">{d.department_name}</span>
                                                {d.department_acronym && <span className="text-[10px] text-muted-foreground">{d.department_acronym}</span>}
                                            </div>
                                            {checked && <CheckIcon className="w-3.5 h-3.5 ml-auto text-primary shrink-0" />}
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {selectedDepts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedDepts.map((d) => (
                        <span key={d.department_id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                            {d.department_acronym ?? d.department_name}
                            <button type="button" onClick={() => toggle(d.department_id)} className="hover:text-destructive transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    <button type="button" onClick={() => onChange([])} className="text-[11px] text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2">
                        Clear all
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── Announcement create/edit modal ───────────────────────────────────────────

interface AnnouncementModalProps {
    open: boolean
    editing: Announcement | null
    departments: Department[]
    onClose: () => void
}

function AnnouncementModal({ open, editing, departments, onClose }: AnnouncementModalProps) {
    const isEdit = editing !== null

    const { data, setData, post, put, processing, errors, reset } = useForm<AnnouncementFormData>({
        title: editing?.title ?? "",
        body: editing?.body ?? "",
        is_pinned: editing?.is_pinned ?? false,
        department_ids: editing?.departments.map((d) => d.department_id) ?? [],
    })

    const editor = useEditor({
        extensions: TIPTAP_EXTENSIONS,
        content: editing?.body ?? "",
        onUpdate: ({ editor }) => setData("body", editor.getHTML()),
    })

    function handleClose() { reset(); onClose() }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isEdit) {
            put(route("announcements.update", editing!.id), { onSuccess: handleClose })
        } else {
            post(route("announcements.store"), { onSuccess: handleClose })
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
            <DialogContent className="p-0 gap-0 sm:max-w-2xl max-h-[95vh] flex flex-col">
                <DialogHeader className="px-4 py-4 border-b border-border sm:px-5 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Megaphone className="w-4 h-4 text-primary shrink-0" />
                        {isEdit ? "Edit Announcement" : "New Announcement"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                    <div className="px-4 py-4 space-y-4 overflow-y-auto flex-1 sm:px-5 sm:py-5 sm:space-y-5">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-foreground">
                                Title <span className="text-destructive">*</span>
                            </label>
                            <Input value={data.title} onChange={(e) => setData("title", e.target.value)} placeholder="Announcement title…" className="text-sm" />
                            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                        </div>

                        {/* Body */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-foreground">
                                Body <span className="text-destructive">*</span>
                            </label>
                            <div className={cn(
                                "rounded-md border overflow-hidden transition-[border-color,box-shadow]",
                                "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
                                errors.body ? "border-destructive" : "border-input"
                            )}>
                                <EditorToolbar editor={editor} />
                                <EditorContent editor={editor} className={EDITOR_CLASSNAME} />
                            </div>
                            {errors.body && <p className="text-xs text-destructive">{errors.body}</p>}
                        </div>

                        {/* Department visibility */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-foreground">Visibility</label>
                            <p className="text-xs text-muted-foreground -mt-0.5">Select specific departments, or leave empty to show to everyone.</p>
                            <DepartmentPicker departments={departments} selectedIds={data.department_ids} onChange={(ids) => setData("department_ids", ids)} />
                        </div>

                        {/* Pin toggle */}
                        <button
                            type="button"
                            onClick={() => setData("is_pinned", !data.is_pinned)}
                            className={cn(
                                "w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors text-left",
                                data.is_pinned ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/30"
                            )}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", data.is_pinned ? "bg-primary/15" : "bg-muted")}>
                                    {data.is_pinned ? <Pin className="w-4 h-4 text-primary" /> : <PinOff className="w-4 h-4 text-muted-foreground" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">Pin announcement</p>
                                    <p className="text-xs text-muted-foreground">Always appears at the top of the feed</p>
                                </div>
                            </div>
                            <div className={cn("w-10 h-5.5 rounded-full transition-colors flex items-center px-0.5 shrink-0", data.is_pinned ? "bg-primary" : "bg-muted-foreground/25")}>
                                <div className={cn("w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform", data.is_pinned ? "translate-x-[18px]" : "translate-x-0")} />
                            </div>
                        </button>
                    </div>

                    <DialogFooter className="px-4 py-3 border-t border-border bg-muted/20 shrink-0 sm:px-5 sm:py-4">
                        <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">Cancel</Button>
                        <Button type="submit" size="sm" disabled={processing} className="text-xs gap-1.5">
                            <Megaphone className="w-3.5 h-3.5" />
                            {processing ? "Posting…" : isEdit ? "Save Changes" : "Post Announcement"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Show modal ───────────────────────────────────────────────────────────────

interface ShowModalProps {
    announcement: Announcement | null
    isAdmin: boolean
    onClose: () => void
    onEdit: (a: Announcement) => void
    onDelete: (a: Announcement) => void
}

function AnnouncementShowModal({ announcement: a, isAdmin, onClose, onEdit, onDelete }: ShowModalProps) {
    if (!a) return null

    const initials = [a.author?.first_name, a.author?.last_name]
        .filter(Boolean)
        .map((n) => n![0].toUpperCase())
        .join("") || "?"

    const isEdited = a.created_at !== a.updated_at

    return (
        <Dialog open={!!a} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="p-0 gap-0 sm:max-w-2xl max-h-[95vh] flex flex-col">
                {a.is_pinned && (
                    <div className="h-0.5 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-t-lg shrink-0" />
                )}

                <DialogHeader className="px-4 pt-4 pb-0 sm:px-5 sm:pt-5 shrink-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {a.is_pinned && (
                            <Badge variant="outline" className="gap-1 text-[10px] text-primary border-primary/30 bg-primary/5">
                                <Pin className="w-2.5 h-2.5" /> Pinned
                            </Badge>
                        )}
                        {a.is_global ? (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                                <Globe className="w-2.5 h-2.5" /> All departments
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                                <Building2 className="w-2.5 h-2.5" /> {a.departments.length} department{a.departments.length !== 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>

                    <DialogTitle className="text-base font-semibold leading-snug pr-6">
                        {a.title}
                    </DialogTitle>

                    <div className="flex items-start gap-3 mt-3 pb-4 border-b border-border">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 overflow-hidden shrink-0 flex items-center justify-center">
                            {a.author?.avatar
                                ? <img src={a.author.avatar} alt={a.author.name ?? ""} className="w-full h-full object-cover" />
                                : <span className="text-[10px] font-bold text-primary">{initials}</span>
                            }
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground">{a.author?.name ?? "Unknown"}</p>
                            {/* Stack date/edited on mobile */}
                            <div className="flex flex-col gap-0.5 mt-0.5 sm:flex-row sm:items-center sm:gap-3">
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <CalendarDays className="w-3 h-3 shrink-0" />
                                    {format(parseISO(a.created_at), "MMMM d, yyyy · h:mm a")}
                                </span>
                                {isEdited && (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70 italic">
                                        <Clock className="w-3 h-3 shrink-0" />
                                        edited {format(parseISO(a.updated_at), "MMM d, yyyy")}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0">
                    <div
                        className={cn(
                            "px-4 py-4 text-foreground/85 text-sm leading-relaxed sm:px-5",
                            "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2",
                            "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5",
                            "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1",
                            "[&_p]:my-1.5 [&_p]:leading-relaxed",
                            "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2",
                            "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2",
                            "[&_li]:my-0.5 [&_li]:leading-relaxed",
                            "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3.5 [&_blockquote]:text-muted-foreground [&_blockquote]:my-2",
                            "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:text-xs [&_code]:font-mono",
                            "[&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:my-2 [&_pre]:overflow-x-auto",
                            "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
                            "[&_mark]:rounded-sm [&_mark]:px-0.5",
                        )}
                        dangerouslySetInnerHTML={{ __html: a.body }}
                    />
                </ScrollArea>

                {!a.is_global && a.departments.length > 0 && (
                    <div className="px-4 py-3 border-t border-border/60 bg-muted/20 shrink-0 sm:px-5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Visible to</p>
                        <div className="flex flex-wrap gap-1.5">
                            {a.departments.map((d) => (
                                <Badge key={d.department_id} variant="outline" className="text-[10px] font-medium rounded-full">
                                    {d.department_name}
                                    {d.department_acronym && (
                                        <span className="ml-1 text-muted-foreground">· {d.department_acronym}</span>
                                    )}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer — stacks on mobile, row on sm+ */}
                <DialogFooter className="px-4 py-3 border-t border-border bg-muted/20 shrink-0 sm:px-5 sm:py-3.5 flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-0">
                    <div className="flex items-center gap-1.5">
                        {isAdmin && (
                            <>
                                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 flex-1 sm:flex-none sm:h-7" onClick={() => { onClose(); onEdit(a) }}>
                                    <Pencil className="w-3 h-3" /> Edit
                                </Button>
                                <Button
                                    variant="outline" size="sm"
                                    className="h-8 text-xs gap-1.5 flex-1 sm:flex-none sm:h-7 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                                    onClick={() => { onClose(); onDelete(a) }}
                                >
                                    <Trash2 className="w-3 h-3" /> Delete
                                </Button>
                            </>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs w-full sm:w-auto sm:h-7">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Announcement card ────────────────────────────────────────────────────────

interface AnnouncementCardProps {
    announcement: Announcement
    isAdmin: boolean
    onView: (a: Announcement) => void
    onEdit: (a: Announcement) => void
    onDelete: (a: Announcement) => void
}

function AnnouncementCard({ announcement: a, isAdmin, onView, onEdit, onDelete }: AnnouncementCardProps) {
    const initials = [a.author?.first_name, a.author?.last_name]
        .filter(Boolean)
        .map((n) => n![0].toUpperCase())
        .join("") || "?"

    return (
        <article
            className={cn(
                "group relative flex flex-col gap-0 rounded-xl border bg-card shadow-xs overflow-hidden transition-shadow hover:shadow-md cursor-pointer",
                a.is_pinned && "border-primary/30 ring-1 ring-primary/10"
            )}
            onClick={() => onView(a)}
        >
            {a.is_pinned && (
                <div className="h-0.5 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            )}

            <div className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 overflow-hidden shrink-0 flex items-center justify-center">
                            {a.author?.avatar
                                ? <img src={a.author.avatar} alt={a.author.name ?? ""} className="w-full h-full object-cover" />
                                : <span className="text-[10px] font-bold text-primary">{initials}</span>
                            }
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{a.author?.name ?? "Unknown"}</p>
                            <p className="text-[10px] text-muted-foreground">{format(parseISO(a.created_at), "MMM d, yyyy · h:mm a")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                        {a.is_pinned && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                                <Pin className="w-2.5 h-2.5" /> Pinned
                            </span>
                        )}
                        {a.is_global
                            ? <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5"><Globe className="w-2.5 h-2.5" /> All</span>
                            : <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5"><Building2 className="w-2.5 h-2.5" /> {a.departments.length} dept{a.departments.length !== 1 ? "s" : ""}</span>
                        }
                    </div>
                </div>

                <h3 className="text-sm font-semibold text-foreground leading-snug">{a.title}</h3>

                <div
                    className={cn(
                        "text-sm text-foreground/80 line-clamp-4 leading-relaxed",
                        "[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4",
                        "[&_h2]:font-semibold [&_h3]:font-semibold",
                        "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-2 [&_blockquote]:text-muted-foreground",
                        "[&_a]:text-primary [&_a]:underline",
                        "[&_mark]:rounded-sm [&_mark]:px-0.5",
                    )}
                    dangerouslySetInnerHTML={{ __html: a.body }}
                />

                {!a.is_global && a.departments.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
                        {a.departments.slice(0, 3).map((d) => (
                            <span key={d.department_id} className="text-[10px] font-medium bg-muted text-muted-foreground border border-border/60 rounded-full px-2 py-0.5">
                                {d.department_name}
                            </span>
                        ))}
                        {a.departments.length > 3 && (
                            <span className="text-[10px] font-medium bg-muted text-muted-foreground border border-border/60 rounded-full px-2 py-0.5">
                                +{a.departments.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                {a.created_at !== a.updated_at && (
                    <p className="text-[10px] text-muted-foreground/60 italic">edited {format(parseISO(a.updated_at), "MMM d, yyyy")}</p>
                )}
            </div>

            {/* Admin actions — always visible on touch, hover-only on pointer devices */}
            {isAdmin && (
                <div
                    className="flex items-center gap-1 px-3 py-2.5 border-t border-border/50 bg-muted/20
                        sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => onEdit(a)}>
                        <Pencil className="w-3 h-3" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(a)}>
                        <Trash2 className="w-3 h-3" /> Delete
                    </Button>
                </div>
            )}
        </article>
    )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onCreate, isAdmin }: { onCreate: () => void; isAdmin: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center col-span-full sm:py-24">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Megaphone className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <div>
                <p className="text-sm font-semibold">No announcements yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {isAdmin ? "Post the first announcement to keep everyone in the loop." : "Check back later for updates from your organization."}
                </p>
            </div>
            {isAdmin && (
                <Button size="sm" onClick={onCreate} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> New Announcement
                </Button>
            )}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnnouncementsIndex({ announcements, departments }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>()
    const { hasRole } = useAuth()

    const isAdmin =
        hasRole("super_admin") ||
        hasRole("hr_admin") ||
        hasRole("ogm")

    const [modalOpen, setModalOpen] = useState(false)
    const [viewing, setViewing] = useState<Announcement | null>(null)
    const [editing, setEditing] = useState<Announcement | null>(null)
    const [deleting, setDeleting] = useState<Announcement | null>(null)
    const [search, setSearch] = useState("")

    const { delete: destroy, processing: destroying } = useForm()

    const pinned = announcements.filter((a) => a.is_pinned)
    const unpinned = announcements.filter((a) => !a.is_pinned)

    const filterAnnouncements = (list: Announcement[]) =>
        search.trim()
            ? list.filter((a) =>
                a.title.toLowerCase().includes(search.toLowerCase()) ||
                a.author?.name?.toLowerCase().includes(search.toLowerCase()) ||
                a.departments.some((d) => d.department_name.toLowerCase().includes(search.toLowerCase()))
            )
            : list

    const filteredPinned = filterAnnouncements(pinned)
    const filteredUnpinned = filterAnnouncements(unpinned)
    const totalFiltered = filteredPinned.length + filteredUnpinned.length

    function openCreate() { setEditing(null); setModalOpen(true) }
    function openEdit(a: Announcement) { setEditing(a); setModalOpen(true) }
    function closeModal() { setModalOpen(false); setEditing(null) }

    function handleDelete() {
        if (!deleting) return
        destroy(route("announcements.destroy", deleting.id), {
            onSuccess: () => setDeleting(null),
        })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcements" />

            <div className="flex flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-5">

                {/* ── Header ── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Announcements</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {announcements.length === 0
                                ? "No announcements posted yet"
                                : `${announcements.length} announcement${announcements.length !== 1 ? "s" : ""}${pinned.length > 0 ? ` · ${pinned.length} pinned` : ""}`
                            }
                        </p>
                    </div>
                    {/* Search + button — full width on mobile, inline on sm+ */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search announcements…"
                                className="pl-8 h-9 text-sm w-full sm:w-56 sm:h-8"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        {isAdmin && (
                            <Button size="sm" onClick={openCreate} className="gap-1.5 shrink-0 h-9 sm:h-8">
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline sm:inline">New Announcement</span>
                                <span className="xs:hidden sm:hidden">New</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Flash ── */}
                {props.flash?.success && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 [&>svg]:text-green-600 dark:[&>svg]:text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <AlertDescription className="text-green-700 dark:text-green-300">
                            {props.flash.success}
                        </AlertDescription>
                    </Alert>
                )}

                {/* ── Search empty state ── */}
                {search && totalFiltered === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center sm:py-16">
                        <Search className="w-8 h-8 text-muted-foreground/30" />
                        <div>
                            <p className="text-sm font-medium">No results for "{search}"</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Try searching by title, author, or department.</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="gap-1.5">
                            <X className="w-3.5 h-3.5" /> Clear search
                        </Button>
                    </div>
                )}

                {/* ── Empty state ── */}
                {announcements.length === 0 && !search && (
                    <div className="grid">
                        <EmptyState onCreate={openCreate} isAdmin={isAdmin} />
                    </div>
                )}

                {/* ── Pinned section ── */}
                {filteredPinned.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Pin className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Pinned</span>
                            <div className="flex-1 h-px bg-primary/15" />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
                            {filteredPinned.map((a) => (
                                <AnnouncementCard key={a.id} announcement={a} isAdmin={isAdmin} onView={setViewing} onEdit={openEdit} onDelete={setDeleting} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── All announcements ── */}
                {filteredUnpinned.length > 0 && (
                    <section className="space-y-3">
                        {filteredPinned.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Megaphone className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">All Announcements</span>
                                <div className="flex-1 h-px bg-border" />
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
                            {filteredUnpinned.map((a) => (
                                <AnnouncementCard key={a.id} announcement={a} isAdmin={isAdmin} onView={setViewing} onEdit={openEdit} onDelete={setDeleting} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* ── Show modal ── */}
            <AnnouncementShowModal
                announcement={viewing}
                isAdmin={isAdmin}
                onClose={() => setViewing(null)}
                onEdit={openEdit}
                onDelete={setDeleting}
            />

            {/* ── Create / Edit modal ── */}
            <AnnouncementModal
                key={editing?.id ?? "create"}
                open={modalOpen}
                editing={editing}
                departments={departments}
                onClose={closeModal}
            />

            {/* ── Delete confirm ── */}
            <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-destructive" />
                            Delete Announcement?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            "<span className="font-medium text-foreground">{deleting?.title}</span>" will be permanently removed and cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            onClick={handleDelete}
                            disabled={destroying}
                        >
                            {destroying ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    )
}