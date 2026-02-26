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

export const TYPE_PILL: Record<string, string> = {
  "Regular Holiday":     "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "Special Non-Working": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "Special Working":     "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  "Local Holiday":       "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
}

export const TYPE_DOT: Record<string, string> = {
  "Regular Holiday":     "bg-rose-400",
  "Special Non-Working": "bg-amber-400",
  "Special Working":     "bg-sky-400",
  "Local Holiday":       "bg-violet-400",
}

export const TYPE_COLOR_CLASSES: Record<string, string> = {
  "Regular Holiday":     "text-rose-500",
  "Special Non-Working": "text-amber-500",
  "Special Working":     "text-sky-500",
  "Local Holiday":       "text-violet-500",
}