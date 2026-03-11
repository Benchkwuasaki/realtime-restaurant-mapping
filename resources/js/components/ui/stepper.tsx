"use client"

import { Check } from "lucide-react"
import { type LucideIcon } from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"

// ─── Step ─────────────────────────────────────────────────────────────────────

interface StepProps {
    index: number
    title: string
    description?: string
    isCompleted?: boolean
    isActive?: boolean
    isLast?: boolean
    icon?: LucideIcon
}

const Step: React.FC<StepProps> = ({
    index,
    title,
    description,
    isCompleted,
    isActive,
    isLast,
    icon: Icon,
}) => {
    return (
        <div className="flex flex-1 items-center gap-3">
            {/* Circle — always shows number; checkmark when completed */}
            <div className="relative flex shrink-0 items-center justify-center">
                <div
                    className={cn(
                        "size-9 rounded-full border-2 flex items-center justify-center transition-colors",
                        isCompleted
                            ? "border-primary bg-primary text-primary-foreground"
                            : isActive
                                ? "border-primary bg-background text-primary"
                                : "border-muted-foreground/30 bg-background text-muted-foreground",
                    )}
                >
                    {isCompleted ? (
                        <Check className="size-4" />
                    ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                </div>
            </div>

            {/* Labels */}
            <div className="flex flex-col">
                {/* Description ("Step N") always rendered when provided */}
                <p className="text-xs text-muted-foreground leading-none mb-0.5">
                    {description ?? `Step ${index + 1}`}
                </p>
                <div className="flex items-center gap-1.5">
                    {/* Icon sits next to title text, not inside the circle */}
                    {Icon && (
                        <Icon
                            className={cn(
                                "size-3.5 shrink-0",
                                isActive || isCompleted
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                            )}
                        />
                    )}
                    <p
                        className={cn(
                            "text-sm font-medium leading-snug",
                            isActive || isCompleted
                                ? "text-foreground"
                                : "text-muted-foreground",
                        )}
                    >
                        {title}
                    </p>
                </div>
            </div>

            {/* Connector line — hidden on last step */}
            {!isLast && (
                <div
                    className={cn(
                        "ml-auto hidden md:block h-px flex-1 mx-4 min-w-6 transition-colors",
                        isCompleted ? "bg-primary" : "bg-border",
                    )}
                />
            )}
        </div>
    )
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

interface StepConfig {
    title: string
    description?: string
    icon?: LucideIcon
}

interface StepperProps {
    steps: StepConfig[]
    currentStep: number
    onStepChange: (step: number) => void
}

export function Stepper({ steps, currentStep }: StepperProps) {
    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-y-3 pb-6">
                {steps.map((step, index) => (
                    <Step
                        key={step.title}
                        index={index}
                        title={step.title}
                        description={step.description}
                        icon={step.icon}
                        isCompleted={index < currentStep}
                        isActive={index === currentStep}
                        isLast={index === steps.length - 1}
                    />
                ))}
            </div>
        </div>
    )
}