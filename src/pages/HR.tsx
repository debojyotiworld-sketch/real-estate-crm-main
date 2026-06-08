import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeTable } from "@/components/hr/EmployeeTable";
import { PayrollTab } from "@/components/hr/PayrollTab";
import { Users, FileText } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions"; 

const HR = () => {
    const { can, loading } = usePermissions();

    const canViewEmployees = can("view_hr"); 
    const canViewPayroll = can("view_payroll");

    if (loading) {
        return (
            <MainLayout title="HR & Payroll Workspace">
                <div className="p-8 text-center text-gray-500">Loading permissions...</div>
            </MainLayout>
        );
    }

    const defaultTab = canViewEmployees ? "employees" : "payslips";

    return (
        <MainLayout title="HR & Payroll Workspace" subtitle="Manage your company's workforce, organizational structure, and run monthly payroll operations.">
            <div className="w-full max-w-[1400px] mx-auto space-y-6">

                {/* Tabs Segment - LEFT ALIGNED */}
                <Tabs defaultValue={defaultTab} className="w-full">
                    <div className="mb-6"> 
                        <div className="bg-white p-1 rounded-lg inline-flex border shadow-sm">
                            <TabsList className="bg-transparent p-0 h-auto gap-2">
                                
                                {canViewEmployees && (
                                    <TabsTrigger 
                                        value="employees" 
                                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-2.5 font-medium transition-all"
                                    >
                                        <Users className="h-4 w-4 mr-2" />
                                        Employee Directory
                                    </TabsTrigger>
                                )}

                                {canViewPayroll && (
                                    <TabsTrigger 
                                        value="payslips" 
                                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-2.5 font-medium transition-all"
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Payroll & Payslips
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </div>
                    </div>

                    {canViewEmployees && (
                        <TabsContent value="employees" className="mt-0 outline-none">
                            <EmployeeTable />
                        </TabsContent>
                    )}

                    {canViewPayroll && (
                        <TabsContent value="payslips" className="mt-0 outline-none">
                            <PayrollTab />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </MainLayout>
    );
};

export default HR;