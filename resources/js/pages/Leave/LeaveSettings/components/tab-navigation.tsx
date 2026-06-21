import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarRange, Calendar1 } from 'lucide-react';
import LeaveTypeIndex from '../LeaveTypeIndex';
import LeaveEntitlementIndex from '../LeaveEntitlementIndex';
import type { LeaveType, LeaveEntitlement } from '../data/schema';

type LeaveTabsProps = {
    leave_types: LeaveType[];
    leave_entitlements: LeaveEntitlement[];
};

export function LeaveTabs({ leave_types, leave_entitlements }: LeaveTabsProps) {
    return (
        <Tabs defaultValue="leave-types" className="flex flex-1 flex-col">
            <section className="border-border shrink-0 overflow-x-auto border-b pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TabsList className="flex h-auto flex-nowrap gap-0 bg-transparent p-0">
                    <TabsTrigger
                        value="leave-types"
                        className="text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-primary hover:text-foreground relative flex items-center gap-1.5 whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-xs font-semibold transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <CalendarRange className="h-3.5 w-3.5 shrink-0" /> Leave
                        Types
                    </TabsTrigger>
                    <TabsTrigger
                        value="leave-entitlements"
                        className="text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-primary hover:text-foreground relative flex items-center gap-1.5 whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-xs font-semibold transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <Calendar1 className="h-3.5 w-3.5 shrink-0" /> Leave
                        Entitlement
                    </TabsTrigger>
                </TabsList>
            </section>

            <section className="mt-4">
                <TabsContent
                    value="leave-types"
                    className="mt-0 flex-1 overflow-y-auto"
                >
                    <LeaveTypeIndex leave_types={leave_types} />
                </TabsContent>
                <TabsContent
                    value="leave-entitlements"
                    className="mt-0 flex-1 overflow-y-auto"
                >
                    <LeaveEntitlementIndex
                        leave_entitlements={leave_entitlements}
                        leave_types={leave_types}
                    />
                </TabsContent>
            </section>
        </Tabs>
    );
}
