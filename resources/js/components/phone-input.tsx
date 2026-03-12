'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import {
    getCountries,
    getCountryCallingCode,
    parsePhoneNumber,
    type Country,
} from 'react-phone-number-input'
import en from 'react-phone-number-input/locale/en'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

// ─── All countries from libphonenumber ────────────────────────────────────────

const ALL_COUNTRIES: { code: Country; name: string; dialCode: string }[] =
    getCountries()
        .map(code => ({
            code,
            name: en[code] ?? code,
            dialCode: `+${getCountryCallingCode(code)}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

// ─── Flag image ───────────────────────────────────────────────────────────────

function FlagImg({ country }: { country: Country }) {
    return (
        <img
            src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`}
            alt={country}
            className="w-5 h-3.5 object-cover rounded-sm shrink-0"
        />
    )
}

// ─── Main PhoneInput ──────────────────────────────────────────────────────────

export interface PhoneInputProps {
    value?: string
    onChange?: (value: string) => void
    defaultCountry?: Country
    placeholder?: string
    className?: string
    disabled?: boolean
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    (
        {
            value,
            onChange,
            defaultCountry = 'PH',
            placeholder = 'Enter phone number',
            className,
            disabled,
        },
        ref
    ) => {
        const [open, setOpen] = React.useState(false)
        const [country, setCountry] = React.useState<Country>(defaultCountry)
        const [localNumber, setLocalNumber] = React.useState('')

        React.useEffect(() => {
            if (!value) {
                setLocalNumber('')
                return
            }
            const dc = `+${getCountryCallingCode(country)}`
            const withoutDial = value.startsWith(dc) ? value.slice(dc.length) : value
            const restored = withoutDial && !withoutDial.startsWith('0') ? `0${withoutDial}` : withoutDial
            setLocalNumber(restored)
        }, [value])

        const dialCode = `+${getCountryCallingCode(country)}`

        // When country changes, recompose the full E.164 value
        const handleCountryChange = (code: Country) => {
            setCountry(code)
            setOpen(false)
            const newDialCode = `+${getCountryCallingCode(code)}`
            const composed = localNumber ? `${newDialCode}${localNumber.replace(/^\+?\d*\s?/, '')}` : ''
            onChange?.(composed)
        }

        // When user types in the number field
        const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value
            setLocalNumber(raw)
            // Strip leading 0 for international format
            const stripped = raw.startsWith('0') ? raw.slice(1) : raw
            const composed = stripped ? `${dialCode}${stripped}` : ''
            onChange?.(composed)
        }

        return (
            <div className={cn('flex w-full', className)}>
                {/* Country selector */}
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            disabled={disabled}
                            className="flex items-center gap-1.5 px-2 h-9 border-r-0 rounded-r-none shrink-0 focus:z-10"
                        >
                            <FlagImg country={country} />
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {dialCode}
                            </span>
                            <ChevronsUpDown className="h-3 w-3 opacity-50 shrink-0" />
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-72 p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search country…" />
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandList>
                                <CommandGroup>
                                    {ALL_COUNTRIES.map(({ code, name, dialCode: dc }) => (
                                        <CommandItem
                                            key={code}
                                            value={name}
                                            onSelect={() => handleCountryChange(code)}
                                            className="flex items-center gap-2.5 cursor-pointer"
                                        >
                                            <FlagImg country={code} />
                                            <span className="flex-1 text-sm">{name}</span>
                                            <span className="text-xs text-muted-foreground tabular-nums">
                                                {dc}
                                            </span>
                                            <Check className={cn(
                                                'h-3.5 w-3.5 shrink-0',
                                                country === code ? 'opacity-100' : 'opacity-0'
                                            )} />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Phone number input */}
                <Input
                    ref={ref}
                    type="tel"
                    placeholder={placeholder}
                    value={localNumber}
                    onChange={handleNumberChange}
                    disabled={disabled}
                    className="rounded-l-none border-l-0 focus-visible:z-10"
                />
            </div>
        )
    }
)
PhoneInput.displayName = 'PhoneInput'

export { PhoneInput, type Country }