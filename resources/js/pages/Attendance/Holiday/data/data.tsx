import { type VariantProps } from "class-variance-authority"
import { type badgeVariants } from "@/components/ui/badge"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

export const holidayTypes = [
  {
    value: "Regular Holiday",
    label: "Regular Holiday",
  },
  {
    value: "Special Non-Working",
    label: "Special Non-Working",
  },
  {
    value: "Special Working",
    label: "Special Working",
  },
  {
    value: "Local Holiday",
    label: "Local Holiday",
  },
]

export const TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  "Regular Holiday":     "red",
  "Special Non-Working": "yellow",
  "Special Working":     "blue",
  "Local Holiday":       "gray",
}