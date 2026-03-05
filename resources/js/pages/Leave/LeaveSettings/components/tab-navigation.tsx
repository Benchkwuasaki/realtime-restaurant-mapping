import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarRange, Calendar1 } from "lucide-react"
import LeaveTypeIndex from '../LeaveTypeIndex';
import LeaveEntitlementIndex from '../LeaveEntitlementIndex';
import type { LeaveType, LeaveEntitlement } from '../data/schema';


type LeaveTabsProps = {
    leave_types: LeaveType[];
    leave_entitlements: LeaveEntitlement[];
}


export function LeaveTabs({ leave_types, leave_entitlements }: LeaveTabsProps) {
    return (

        <Tabs defaultValue="leave-types" className="flex flex-col flex-1">
            <section className="border-b border-border  pt-1 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <TabsList className="h-auto bg-transparent gap-0 p-0 flex flex-nowrap">

                    <TabsTrigger
                        value="leave-types"
                        className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors whitespace-nowrap">
                        <CalendarRange className="w-3.5 h-3.5 shrink-0" />  Leave Types 
                    </TabsTrigger>
                    <TabsTrigger
                        value="leave-entitlements"
                        className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors whitespace-nowrap">
                        <Calendar1 className="w-3.5 h-3.5 shrink-0" /> Leave Entitlement
                    </TabsTrigger>

                </TabsList>
            </section>

            <section className="mt-4">
                <TabsContent value="leave-types" className="flex-1 mt-0 overflow-y-auto">
                    <LeaveTypeIndex leave_types={leave_types} />
                </TabsContent>
                <TabsContent value="leave-entitlements" className="flex-1 mt-0 overflow-y-auto">
                    <LeaveEntitlementIndex leave_entitlements={leave_entitlements} leave_types={leave_types} />
                </TabsContent>
            </section>

        </Tabs>
    )
}