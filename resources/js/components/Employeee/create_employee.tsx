"use client"

import { useState } from "react"
import { Stepper } from "@/components/ui/stepper"
import { BadgeCheck, BriefcaseBusiness, GraduationCap, HandCoins, Landmark, NotepadText, User, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// ---- Types ----
interface SelectOption {
    label: string
    value: string
}

interface FormFieldProps {
    id: string
    label: string
    placeholder?: string
    required?: boolean
    type?: "input" | "select" | "date" | "email"
    options?: SelectOption[]
}

// ---- Reusable FormField ----
const FormField: React.FC<FormFieldProps> = ({ id, label, placeholder, required, type = "input", options = [] }) => (
    <div className="space-y-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {type === "select" && (
            <Select>
                <SelectTrigger id={id}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )}
        {type === "date" && <Input id={id} type="date" required={required} />}
        {(type === "input" || type === "email") && (
            <Input id={id} type={type} placeholder={placeholder} required={required} />
        )}
    </div>
)

// ---- Fields per step ----
const basicInfoFields: FormFieldProps[] = [
    { id: "firstName",    label: "First Name",    placeholder: "John",                     required: true },
    { id: "lastName",     label: "Last Name",      placeholder: "Doe",                      required: true },
    { id: "middleName",   label: "Middle Name",    placeholder: "Humba",                    required: false },
    { id: "nameExtension",label: "Name Extension", placeholder: "Jr., Sr., III",            required: false },
    { id: "sex",          label: "Sex",            placeholder: "Select sex",               required: true, type: "select",
      options: [{ label: "Male", value: "1" }, { label: "Female", value: "0" }] },
    { id: "dateOfBirth",  label: "Date of Birth",                                           required: true, type: "date" },
    { id: "email",        label: "Email",          placeholder: "johndoe@gmail.com",        required: true, type: "email" },
    { id: "contactNumber",label: "Contact Number", placeholder: "09XXXXXXXXXX",             required: true },
    { id: "homeAddress",  label: "Home Address",   placeholder: "Street, Barangay, City",   required: true },
]

const employmentFields: FormFieldProps[] = [
    { id: "employeeId",    label: "Employee ID",     placeholder: "EMP-0001",   required: true },
    { id: "department",    label: "Department",      placeholder: "HR, IT...",  required: true },
    { id: "dateHired",     label: "Date Hired",                                 required: true, type: "date" },
    { id: "employmentStatus", label: "Employment Status", placeholder: "Select status", required: true, type: "select",
      options: [
          { label: "Regular",     value: "regular" },
          { label: "Contractual", value: "contractual" },
          { label: "Probationary",value: "probationary" },
      ]
    },
]

const positionFields: FormFieldProps[] = [
    { id: "jobTitle",    label: "Job Title",     placeholder: "Software Engineer", required: true },
    { id: "salaryGrade", label: "Salary Grade",  placeholder: "SG-15",            required: true },
    { id: "stepIncrement",label: "Step Increment",placeholder: "1",               required: true },
]

const educationFields: FormFieldProps[] = [
    { id: "elementary",  label: "Elementary School",  placeholder: "School name", required: true },
    { id: "highSchool",  label: "High School",         placeholder: "School name", required: false },
    { id: "college",     label: "College",             placeholder: "School name", required: false },
    { id: "course",      label: "Course/Degree",       placeholder: "BS Computer Science", required: false },
    { id: "postGrad",    label: "Post Graduate",       placeholder: "School name", required: false },
]

const familyFields: FormFieldProps[] = [
    { id: "spouseName",    label: "Spouse Name",     placeholder: "Full name",       required: false },
    { id: "fatherName",    label: "Father's Name",   placeholder: "Full name",       required: true },
    { id: "motherName",    label: "Mother's Name",   placeholder: "Full name",       required: true },
    { id: "numChildren",   label: "No. of Children", placeholder: "0",               required: false },
]

const governmentFields: FormFieldProps[] = [
    { id: "sss",     label: "SSS Number",    placeholder: "XX-XXXXXXX-X", required: false },
    { id: "gsis",    label: "GSIS Number",   placeholder: "XXXXXXXXXXXX", required: false },
    { id: "tin",     label: "TIN",           placeholder: "XXX-XXX-XXX", required: false },
    { id: "philhealth", label: "PhilHealth", placeholder: "XXXXXXXXXXXX", required: false },
    { id: "pagibig", label: "Pag-IBIG",      placeholder: "XXXXXXXXXXXX", required: false },
]

const allowanceFields: FormFieldProps[] = [
    { id: "basicSalary",   label: "Basic Salary",    placeholder: "0.00", required: true },
    { id: "riceAllowance", label: "Rice Allowance",  placeholder: "0.00", required: false },
    { id: "clothingAllowance", label: "Clothing Allowance", placeholder: "0.00", required: false },
    { id: "transportAllowance", label: "Transport Allowance", placeholder: "0.00", required: false },
]

// ---- Map step index to fields ----
const stepFields: Record<number, FormFieldProps[]> = {
    0: basicInfoFields,
    1: employmentFields,
    2: positionFields,
    3: educationFields,
    4: familyFields,
    5: governmentFields,
    6: allowanceFields,
    // 7: Review step — handled separately below
}

// ---- Steps ----
const steps = [
    { title: "Basic Information", description: "Step 1", icon: User },
    { title: "Employment",        description: "Step 2", icon: BriefcaseBusiness },
    { title: "Position",          description: "Step 3", icon: NotepadText },
    { title: "Education",         description: "Step 4", icon: GraduationCap },
    { title: "Family",            description: "Step 5", icon: Users },
    { title: "Government",        description: "Step 6", icon: Landmark },
    { title: "Allowance",         description: "Step 7", icon: HandCoins },
    { title: "Review",            description: "Step 8", icon: BadgeCheck },
]

// ---- Review Step ----
const ReviewStep = () => (
    <div className="space-y-2">
        <p className="text-muted-foreground">Please review all the information you have entered before submitting.</p>
        {/* You can map over all steps and show a summary here later */}
    </div>
)

// ---- Main Component ----
export default function StepperDemo() {
    const [currentStep, setCurrentStep] = useState(0)
    const CurrentIcon = steps[currentStep].icon
    const isLastStep = currentStep === steps.length - 1

    return (
        <div className="px-10 pt-5">
            <Stepper steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />
            <div className="mt-8 p-4 border rounded-md">
                <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <CurrentIcon className="w-5 h-5" />
                    {steps[currentStep].title}
                </h2>
                <form className="my-5">
                    <Field>
                        {isLastStep ? (
                            <ReviewStep />
                        ) : (
                            <div className="grid grid-cols-3 gap-5">
                                {(stepFields[currentStep] ?? []).map((field) => (
                                    <FormField key={field.id} {...field} />
                                ))}
                            </div>
                        )}
                    </Field>
                </form>

                <div className="flex justify-between mt-5">
                    <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0}>
                        Previous
                    </Button>
                    <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={isLastStep}>
                        {isLastStep ? "Finish" : "Next"}
                    </Button>
                </div>
            </div>
        </div>
    )
}