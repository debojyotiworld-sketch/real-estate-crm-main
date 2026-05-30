import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Eye, IndianRupee, Trash2, Edit, Users, UserCheck, UserMinus, Briefcase, MapPin, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEmployees } from "@/hooks/hr/useEmployees";
import { EmployeeSalaryModal } from "./EmployeeSalaryModal";
import EmployeeForm from "./EmployeeForm";

export const EmployeeTable = () => {
    const { employees, loading, search, setSearch, page, setPage, pageSize, totalCount, deleteEmployee } = useEmployees();
    
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [salaryOpen, setSalaryOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

    const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize]);
    const activeCount = employees.filter((e: any) => e.status === "active").length;
    const inactiveCount = employees.length - activeCount;

    const openAdd = () => { setSelectedEmployee(null); setAddOpen(true); };
    const openEdit = (emp: any) => { setSelectedEmployee(emp); setEditOpen(true); };
    const openView = (emp: any) => { setSelectedEmployee(emp); setViewOpen(true); };
    const openSalary = (emp: any) => { setSelectedEmployee(emp); setSalaryOpen(true); };
    const handleDelete = (id: string) => { if(window.confirm("Are you sure you want to delete this employee?")) deleteEmployee(id); };

    return (
        <div className="space-y-6">
            {/* SUMMARY CARDS - FULL WIDTH */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600"><Users className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Headcount</p>
                            <h3 className="text-3xl font-bold text-gray-900">{totalCount}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600"><UserCheck className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Staff</p>
                            <h3 className="text-3xl font-bold text-gray-900">{activeCount}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3.5 bg-rose-50 rounded-xl text-rose-600"><UserMinus className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Inactive / Left</p>
                            <h3 className="text-3xl font-bold text-gray-900">{inactiveCount}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* DATA TABLE */}
            <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="relative w-full md:w-[350px]">
                            <Search className="absolute w-4 h-4 mt-3 ml-3 text-muted-foreground" />
                            <Input placeholder="Search name, code, email..." className="pl-10 h-10 bg-slate-50 border-slate-200" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <Button onClick={openAdd} className="h-10 px-6 shadow-sm"><Plus className="h-4 w-4 mr-2" /> Add Employee</Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-700">Employee Details</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Department & Role</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableRow><TableCell colSpan={5} className="text-center py-12">Loading...</TableCell></TableRow> : 
                                employees.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No records found.</TableCell></TableRow> :
                                employees.map((emp: any) => (
                                    <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border shadow-sm"><AvatarImage src={emp.photo_url || ""} /><AvatarFallback className="bg-primary/10 text-primary">{emp.name?.charAt(0)}</AvatarFallback></Avatar>
                                                <div>
                                                    <div className="font-bold text-gray-900">{emp.name}</div>
                                                    <div className="text-xs font-medium text-slate-500">{emp.employee_code}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-gray-800">{emp.designation || "-"}</div>
                                            <div className="text-xs text-slate-500">{emp.department || "-"}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-700">{emp.phone || "-"}</div>
                                            <div className="text-xs text-slate-500">{emp.email || "-"}</div>
                                        </TableCell>
                                        <TableCell>
                                            {emp.status === 'active' 
                                                ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold px-3 py-1 shadow-none">Active</Badge> 
                                                : <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none font-bold px-3 py-1 shadow-none">Inactive</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openView(emp)} title="View Profile"><Eye className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-500 hover:bg-orange-50" onClick={() => openEdit(emp)} title="Edit Employee"><Edit className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => openSalary(emp)} title="Manage Salary"><IndianRupee className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(emp.id)} title="Delete Employee"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-6 border-t pt-4">
                        <div className="text-sm font-medium text-slate-500">Showing {employees.length} of {totalCount} entries</div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                            <div className="text-sm font-medium px-4">Page {page} of {totalPages || 1}</div>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <EmployeeForm open={addOpen} onOpenChange={setAddOpen} />
            <EmployeeForm open={editOpen} onOpenChange={setEditOpen} employee={selectedEmployee} />
            <EmployeeSalaryModal open={salaryOpen} onOpenChange={setSalaryOpen} employee={selectedEmployee} />

            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="sm:max-w-[700px] overflow-hidden p-0 rounded-xl">
                    <DialogHeader className="p-6 bg-slate-50 border-b">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <Avatar className="h-12 w-12 border shadow-sm"><AvatarImage src={selectedEmployee?.photo_url || ""} /><AvatarFallback>{selectedEmployee?.name?.charAt(0)}</AvatarFallback></Avatar>
                            <div>
                                <div className="text-gray-900">{selectedEmployee?.name}</div>
                                <div className="text-sm text-slate-500 font-medium">EMP Code: {selectedEmployee?.employee_code}</div>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedEmployee && (
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4"/> Professional Details</h3>
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div><p className="text-xs text-slate-500 mb-1">Department</p><p className="font-semibold">{selectedEmployee.department || "—"}</p></div>
                                    <div><p className="text-xs text-slate-500 mb-1">Designation</p><p className="font-semibold">{selectedEmployee.designation || "—"}</p></div>
                                    <div><p className="text-xs text-slate-500 mb-1">Assigned Branch</p><p className="font-semibold">{selectedEmployee.branches?.branch_name || "—"}</p></div>
                                    <div><p className="text-xs text-slate-500 mb-1">Sales Zone (If App.)</p><p className="font-semibold">{selectedEmployee.zone_id ? "Assigned (ID: " + selectedEmployee.zone_id.substring(0,6) + "...)" : "—"}</p></div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4"/> Contact & KYC</h3>
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div><p className="text-xs text-slate-500 mb-1">Email ID</p><p className="font-semibold">{selectedEmployee.email || "—"}</p></div>
                                    <div><p className="text-xs text-slate-500 mb-1">Phone Number</p><p className="font-semibold">{selectedEmployee.phone || "—"}</p></div>
                                    <div><p className="text-xs text-slate-500 mb-1">PAN Number</p><p className="font-semibold uppercase">{selectedEmployee.pan_number || "—"}</p></div>
                                    <div><p className="text-xs text-slate-500 mb-1">Aadhar Number</p><p className="font-semibold">{selectedEmployee.aadhar_number || "—"}</p></div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2"><MapPin className="h-4 w-4"/> Address & Timeline</h3>
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="col-span-2"><p className="text-xs text-slate-500 mb-1">Full Address</p><p className="font-semibold">{[selectedEmployee.address, selectedEmployee.city, selectedEmployee.state, selectedEmployee.pincode].filter(Boolean).join(", ") || "—"}</p></div>
                                    <div><p className="text-xs text-slate-500 mb-1">Joining Date</p><p className="font-semibold">{selectedEmployee.joining_date ? new Date(selectedEmployee.joining_date).toLocaleDateString() : "—"}</p></div>
                                    <div><p className="text-xs text-slate-500 mb-1">Total Experience</p><p className="font-semibold">{selectedEmployee.total_experience || "—"}</p></div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};