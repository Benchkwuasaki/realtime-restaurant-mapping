import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Icon, Pencil, Mail, Phone, Calendar, MapPin, User, Heart, Home,
    Briefcase, Clock, FileText, Landmark, Camera, XCircle,
    Eye, EyeOff, Plus, Trash2, Save, ChevronUp,
    Pen, Upload, Download, FolderOpen,
} from "lucide-react"

export function TabsLine() {
    return (
        <Tabs defaultValue="leave-types">
            <TabsList variant="line">
                <TabsTrigger value="leave-types">Leave Types</TabsTrigger>
                <TabsTrigger value="leave-entitlements">Leave Entitlements</TabsTrigger>
            </TabsList>

            <TabsContent value="leave-types">
            </TabsContent>
            <TabsContent value="leave-entitlements">
            </TabsContent>
        </Tabs>
    )
}



export function LeaveTabs() {
    return (

        <Tabs defaultValue="leave-types" className="flex flex-col flex-1">
            <section className="border-b border-border  pt-1 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <TabsList className="h-auto bg-transparent gap-0 p-0 flex flex-nowrap">

                    <TabsTrigger
                        value="leave-types"
                        className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors whitespace-nowrap">
                        {/* <Icon className="w-3.5 h-3.5 shrink-0" />  */} Leave Types
                    </TabsTrigger>
                    <TabsTrigger
                        value="leave-entitlements"
                        className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors whitespace-nowrap">
                        {/* <Icon className="w-3.5 h-3.5 shrink-0" /> */} Leave Entitlement
                    </TabsTrigger>

                </TabsList>
            </section>

            <section className="mt-4">
                <TabsContent value="leave-types" className="flex-1 mt-0 overflow-y-auto">Type</TabsContent>
                <TabsContent value="leave-entitlements" className="flex-1 mt-0 overflow-y-auto">Entitlement</TabsContent>
            </section>

        </Tabs>
    )
}