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

export const TYPE_TEXT_COLOR: Record<string, string> = {
  "Regular Holiday":     "text-red-500 dark:text-red-400",
  "Special Non-Working": "text-yellow-500 dark:text-yellow-400",
  "Special Working":     "text-blue-500 dark:text-blue-400",
  "Local Holiday":       "text-gray-500 dark:text-gray-400",
}