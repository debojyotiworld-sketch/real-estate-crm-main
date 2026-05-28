import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeTable } from "@/components/hr/EmployeeTable";
import { PayrollTab } from "@/components/hr/PayrollTab";
import { Users, FileText } from "lucide-react";

const HR = () => {
    return (
        <MainLayout title="HR & Payroll Workspace" subtitle="Manage your company's workforce, organizational structure, and run monthly payroll operations.">
            <div className="w-full max-w-[1400px] mx-auto space-y-6">

                {/* Tabs Segment - LEFT ALIGNED */}
                <Tabs defaultValue="employees" className="w-full">
                    <div className="mb-6"> {/* Removed flex and justify-center to keep it left-aligned */}
                        <div className="bg-white p-1 rounded-lg inline-flex border shadow-sm">
                            <TabsList className="bg-transparent p-0 h-auto gap-2">
                                <TabsTrigger 
                                    value="employees" 
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-2.5 font-medium transition-all"
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Employee Directory
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="payslips" 
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-2.5 font-medium transition-all"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Payroll & Payslips
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </div>

                    {/* Tab Contents */}
                    <TabsContent value="employees" className="mt-0 outline-none">
                        <EmployeeTable />
                    </TabsContent>

                    <TabsContent value="payslips" className="mt-0 outline-none">
                        <PayrollTab />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
};

export default HR;