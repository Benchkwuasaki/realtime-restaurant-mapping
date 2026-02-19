import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from 'lucide-react';


export function CreateRequest() {
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const documentName = formData.get("name")
    const documentType = formData.get("username")
    
    console.log("Adding request document:", { documentName, documentType })
  }

  return (
    <Dialog>
      <form onSubmit={handleSubmit}>
        <DialogTrigger asChild>
          <Button variant="default">
            <Plus className="size-5" />
            Create Request
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Request</DialogTitle>
            <DialogDescription>
              Create a request to track a new document.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="name-1">Document Title</Label>
              <Input id="name-1" name="name" placeholder="Enter document name" required />
            </Field>
            <Field>
              <Label htmlFor="username-1">Requesting Office</Label>
              <Input id="username-1" name="username" placeholder="Enter document type" required />
            </Field>
            <Field>
              <Label htmlFor="username-1">Forwarding Office</Label>
              <Input id="username-1" name="username" placeholder="Enter document type" required />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}