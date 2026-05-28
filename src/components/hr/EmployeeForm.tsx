import {
    useEffect,
    useState,
} from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Input,
} from "@/components/ui/input";

import {
    Label,
} from "@/components/ui/label";

import {
    Button,
} from "@/components/ui/button";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

import {
    Upload,
    Loader2,
} from "lucide-react";

import { toast }
    from "sonner";

import {
    useEmployees,
} from "@/hooks/hr/useEmployees";

interface Props {

    open: boolean;

    onOpenChange: (
        open: boolean
    ) => void;

    employee?: any;
}

const initialState = {

    employee_code: "",

    name: "",

    email: "",

    phone: "",

    department: "",

    designation: "",

    branch_id: "",

    zone_id: "",

    role_id: "",

    joining_date:
        new Date()
            .toISOString()
            .split("T")[0],

    attendance_type:
        "office",

    status: "active",

    // ADDRESS

    address: "",

    city: "",

    state: "",

    pincode: "",

    // KYC

    aadhar_number: "",

    pan_number: "",

    // EXPERIENCE

    experience: "",

    total_experience: "",

    previous_company: "",

    previous_document_type: "",

    previous_document_path: "",

    // REPORTING MANAGER

    reporting_manager_name: "",

    reporting_manager_email: "",

    reporting_manager_phone: "",
};

const EmployeeForm = ({
    open,
    onOpenChange,
}: Props) => {

    const {

        saving,

        branches,
        zones,
        roles,

        fetchZones,

        createEmployee,

        generateEmployeeCode,

        uploadEmployeeFile,

    } = useEmployees();

    const [form, setForm] = useState(initialState);
    const [preview, setPreview] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [aadharPhoto, setAadharPhoto] =
        useState<File | null>(null);

    const [panPhoto, setPanPhoto] =
        useState<File | null>(null);

    const [experienceDoc, setExperienceDoc] =
        useState<File | null>(null);
    const [step, setStep] = useState(1);

    // =========================
    // GENERATE CODE
    // =========================

    useEffect(() => {

        const load =
            async () => {

                if (
                    !form.department
                ) {
                    return;
                }

                const code =
                    await generateEmployeeCode(
                        form.department
                    );

                setForm(prev => ({
                    ...prev,
                    employee_code:
                        code,
                }));
            };

        void load();

    }, [
        form.department
    ]);

    // =========================
    // LOAD ZONES
    // =========================

    useEffect(() => {

        if (
            form.branch_id
        ) {

            void fetchZones(
                form.branch_id
            );
        }

    }, [
        form.branch_id
    ]);

    // =========================
    // IMAGE
    // =========================

    const handleImage =
        (
            file?: File
        ) => {

            if (!file) {
                return;
            }

            setPhoto(file);

            setPreview(
                URL.createObjectURL(
                    file
                )
            );
        };

    // =========================
    // SAVE
    // =========================

    const handleSave =
        async () => {

            if (!form.name) {

                toast.error(
                    "Name required"
                );

                return;
            }

            if (!form.email) {

                toast.error(
                    "Email required"
                );

                return;
            }

            let employeePhotoUrl = "";

            let aadharUrl = "";

            let panUrl = "";

            let experienceUrl = "";

            // =========================
            // EMPLOYEE PHOTO
            // =========================

            if (photo) {

                employeePhotoUrl =
                    await uploadEmployeeFile(
                        photo,
                        "employee-photo"
                    ) || "";
            }

            // =========================
            // AADHAR PHOTO
            // =========================

            if (aadharPhoto) {

                aadharUrl =
                    await uploadEmployeeFile(
                        aadharPhoto,
                        "aadhar"
                    ) || "";
            }

            // =========================
            // PAN PHOTO
            // =========================

            if (panPhoto) {

                panUrl =
                    await uploadEmployeeFile(
                        panPhoto,
                        "pan"
                    ) || "";
            }

            // =========================
            // EXPERIENCE DOCUMENT
            // =========================

            if (experienceDoc) {

                experienceUrl =
                    await uploadEmployeeFile(
                        experienceDoc,
                        "experience"
                    ) || "";
            }

            // =========================
            // CREATE EMPLOYEE
            // =========================

            const response =
                await createEmployee({

                    employee_code:
                        form.employee_code,

                    name:
                        form.name,

                    email:
                        form.email,

                    phone:
                        form.phone,

                    department:
                        form.department,

                    designation:
                        form.designation,

                    branch_id:
                        form.branch_id,

                    zone_id:
                        form.zone_id,

                    joining_date:
                        form.joining_date,

                    role_id:
                        form.role_id,

                    status:
                        form.status,

                    attendance_type:
                        form.attendance_type,

                    // ADDRESS

                    address:
                        form.address,

                    city:
                        form.city,

                    state:
                        form.state,

                    pincode:
                        form.pincode,

                    // KYC

                    aadhar_number:
                        form.aadhar_number,

                    pan_number:
                        form.pan_number,

                    aadhar_photo:
                        aadharUrl,

                    pan_photo:
                        panUrl,

                    // EXPERIENCE

                    experience:
                        form.experience,

                    total_experience:
                        form.total_experience,

                    previous_company:
                        form.previous_company,

                    previous_document_type:
                        form.previous_document_type,

                    previous_document_path:
                        experienceUrl,

                    // REPORTING MANAGER

                    reporting_manager_name:
                        form.reporting_manager_name,

                    reporting_manager_email:
                        form.reporting_manager_email,

                    reporting_manager_phone:
                        form.reporting_manager_phone,
                });

            if (response) {

                toast.success(
                    "Employee created"
                );

                setForm(
                    initialState
                );

                setPreview("");

                setPhoto(null);

                setAadharPhoto(null);

                setPanPhoto(null);

                setExperienceDoc(null);

                onOpenChange(false);
            }
        };

    return (

        <Dialog
            open={open}
            onOpenChange={
                onOpenChange
            }
        >

            <DialogContent
                className="
                    max-w-5xl
                    max-h-[95vh]
                    overflow-y-auto
                "
            >

                <DialogHeader>

                    <DialogTitle>

                        Add Employee

                    </DialogTitle>

                </DialogHeader>

                {/* STEP INDICATOR */}

                <div className="flex items-center justify-center gap-3 mb-6">

                    {[1, 2, 3, 4].map((s) => (

                        <div
                            key={s}
                            className={`
                w-10
                h-10
                rounded-full
                flex
                items-center
                justify-center
                text-sm
                font-semibold
                border
                transition-all

                ${step === s
                                    ? "bg-primary text-white border-primary"
                                    : "bg-muted text-muted-foreground"
                                }
            `}
                        >
                            {s}
                        </div>
                    ))}

                </div>

                {/* ================= STEP 1 ================= */}

                {step === 1 && (

                    <div className="grid md:grid-cols-3 gap-6">

                        {/* LEFT */}

                        <Card>

                            <CardContent
                                className="
                    pt-6
                    space-y-4
                "
                            >

                                <div
                                    className="
                        flex
                        flex-col
                        items-center
                        gap-4
                    "
                                >

                                    <Avatar
                                        className="
                            w-28
                            h-28
                        "
                                    >

                                        <AvatarImage
                                            src={preview}
                                        />

                                        <AvatarFallback>
                                            NA
                                        </AvatarFallback>

                                    </Avatar>

                                    <Label
                                        htmlFor="photo"
                                        className="
                            cursor-pointer
                        "
                                    >

                                        <div
                                            className="
                                border
                                rounded-md
                                px-4
                                py-2
                                flex
                                items-center
                                gap-2
                            "
                                        >

                                            <Upload
                                                className="
                                    h-4
                                    w-4
                                "
                                            />

                                            Upload

                                        </div>

                                    </Label>

                                    <Input
                                        id="photo"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleImage(
                                                e.target.files?.[0]
                                            )
                                        }
                                    />

                                </div>

                                <div>

                                    <Label>
                                        Employee Code
                                    </Label>

                                    <Input
                                        disabled
                                        value={
                                            form.employee_code
                                        }
                                    />

                                </div>

                            </CardContent>

                        </Card>

                        {/* RIGHT */}

                        <Card
                            className="
                md:col-span-2
            "
                        >

                            <CardContent
                                className="
                    pt-6
                    grid
                    md:grid-cols-2
                    gap-4
                "
                            >

                                <div>

                                    <Label>
                                        Full Name
                                    </Label>

                                    <Input
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm(prev => ({
                                                ...prev,
                                                name:
                                                    e.target.value,
                                            }))
                                        }
                                    />

                                </div>

                                <div>

                                    <Label>
                                        Email
                                    </Label>

                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm(prev => ({
                                                ...prev,
                                                email:
                                                    e.target.value,
                                            }))
                                        }
                                    />

                                </div>

                                <div>

                                    <Label>
                                        Phone
                                    </Label>

                                    <Input
                                        value={form.phone}
                                        onChange={(e) =>
                                            setForm(prev => ({
                                                ...prev,
                                                phone:
                                                    e.target.value,
                                            }))
                                        }
                                    />

                                </div>

                                <div>

                                    <Label>
                                        Department
                                    </Label>

                                    <Select
                                        value={form.department}
                                        onValueChange={(v) =>
                                            setForm(prev => ({
                                                ...prev,
                                                department: v,
                                            }))
                                        }
                                    >

                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>

                                        <SelectContent>

                                            <SelectItem value="HR">
                                                HR
                                            </SelectItem>

                                            <SelectItem value="Sales">
                                                Sales
                                            </SelectItem>

                                            <SelectItem value="IT">
                                                IT
                                            </SelectItem>

                                            <SelectItem value="Accounts">
                                                Accounts
                                            </SelectItem>

                                            <SelectItem value="Backoffice">
                                                Backoffice
                                            </SelectItem>

                                        </SelectContent>

                                    </Select>

                                </div>

                            </CardContent>

                        </Card>

                    </div>
                )}

                {/* ================= STEP 2 ================= */}

                {step === 2 && (

                    <Card>

                        <CardContent
                            className="
                pt-6
                grid
                md:grid-cols-2
                gap-4
            "
                        >

                            <div>

                                <Label>
                                    Designation
                                </Label>

                                <Input
                                    value={
                                        form.designation
                                    }
                                    onChange={(e) =>
                                        setForm(prev => ({
                                            ...prev,
                                            designation:
                                                e.target.value,
                                        }))
                                    }
                                />

                            </div>

                            <div>

                                <Label>
                                    Joining Date
                                </Label>

                                <Input
                                    type="date"
                                    value={
                                        form.joining_date
                                    }
                                    onChange={(e) =>
                                        setForm(prev => ({
                                            ...prev,
                                            joining_date:
                                                e.target.value,
                                        }))
                                    }
                                />

                            </div>

                            <div>

                                <Label>
                                    Branch
                                </Label>

                                <Select
                                    value={
                                        form.branch_id
                                    }
                                    onValueChange={(v) =>
                                        setForm(prev => ({
                                            ...prev,
                                            branch_id: v,
                                        }))
                                    }
                                >

                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>

                                    <SelectContent>

                                        {branches.map((b) => (

                                            <SelectItem
                                                key={b.id}
                                                value={b.id}
                                            >
                                                {b.branch_name}
                                            </SelectItem>
                                        ))}

                                    </SelectContent>

                                </Select>

                            </div>

                            <div>

                                <Label>
                                    Zone
                                </Label>

                                <Select
                                    value={form.zone_id}
                                    onValueChange={(v) =>
                                        setForm(prev => ({
                                            ...prev,
                                            zone_id: v,
                                        }))
                                    }
                                >

                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Zone" />
                                    </SelectTrigger>

                                    <SelectContent>

                                        {zones.map((z) => (

                                            <SelectItem
                                                key={z.id}
                                                value={z.id}
                                            >
                                                {z.zone_name}
                                            </SelectItem>
                                        ))}

                                    </SelectContent>

                                </Select>

                            </div>

                        </CardContent>

                    </Card>
                )}

                {/* ================= STEP 3 ================= */}

                {step === 3 && (

                    <Card>

                        <CardContent
                            className="
                pt-6
                grid
                md:grid-cols-2
                gap-4
            "
                        >

                            <div>

                                <Label>
                                    Address
                                </Label>

                                <Input
                                    value={form.address}
                                    onChange={(e) =>
                                        setForm(prev => ({
                                            ...prev,
                                            address:
                                                e.target.value,
                                        }))
                                    }
                                />

                            </div>

                            <div>

                                <Label>
                                    City
                                </Label>

                                <Input
                                    value={form.city}
                                    onChange={(e) =>
                                        setForm(prev => ({
                                            ...prev,
                                            city:
                                                e.target.value,
                                        }))
                                    }
                                />

                            </div>

                            <div>

                                <Label>
                                    State
                                </Label>

                                <Input
                                    value={form.state}
                                    onChange={(e) =>
                                        setForm(prev => ({
                                            ...prev,
                                            state:
                                                e.target.value,
                                        }))
                                    }
                                />

                            </div>

                            <div>

                                <Label>
                                    Pincode
                                </Label>

                                <Input
                                    value={form.pincode}
                                    onChange={(e) =>
                                        setForm(prev => ({
                                            ...prev,
                                            pincode:
                                                e.target.value,
                                        }))
                                    }
                                />

                            </div>

                            <div>

                                <Label>
                                    Aadhar Number
                                </Label>

                                <Input
                                    value={
                                        form.aadhar_number
                                    }
                                    onChange={(e) =>
                                        setForm(prev => ({
                                            ...prev,
                                            aadhar_number:
                                                e.target.value,
                                        }))
                                    }
                                />

                            </div>

                            <div>

                                <Label>
                                    PAN Number
                                </Label>

                                <Input
                                    value={
                                        form.pan_number
                                    }
                                    onChange={(e) =>
                                        setForm(prev => ({
                                            ...prev,
                                            pan_number:
                                                e.target.value,
                                        }))
                                    }
                                />

                            </div>
                            <div>

                                <Label>
                                    Upload Aadhar Photo
                                </Label>

                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setAadharPhoto(
                                            e.target.files?.[0] || null
                                        )
                                    }
                                />

                            </div>

                            <div>

                                <Label>
                                    Upload PAN Photo
                                </Label>

                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setPanPhoto(
                                            e.target.files?.[0] || null
                                        )
                                    }
                                />

                            </div>

                        </CardContent>

                    </Card>
                )}

                {/* ================= STEP 4 ================= */}

                {step === 4 && (

                    <Card>

                        <CardContent
                            className="
                pt-6
                grid
                md:grid-cols-2
                gap-4
            "
                        >

                            <div>

                                <Label>
                                    Experience
                                </Label>

                                <Select
                                    value={form.experience}
                                    onValueChange={(v) =>
                                        setForm(prev => ({
                                            ...prev,
                                            experience: v,
                                        }))
                                    }
                                >

                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>

                                    <SelectContent>

                                        <SelectItem value="yes">
                                            Yes
                                        </SelectItem>

                                        <SelectItem value="no">
                                            No
                                        </SelectItem>

                                    </SelectContent>

                                </Select>

                            </div>

                            {form.experience === "yes" && (
                                <>

                                    <div>

                                        <Label>
                                            Total Experience
                                        </Label>

                                        <Input
                                            value={form.total_experience}
                                            onChange={(e) =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    total_experience:
                                                        e.target.value,
                                                }))
                                            }
                                        />

                                    </div>

                                    <div>

                                        <Label>
                                            Previous Company
                                        </Label>

                                        <Input
                                            value={form.previous_company}
                                            onChange={(e) =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    previous_company:
                                                        e.target.value,
                                                }))
                                            }
                                        />

                                    </div>

                                    <div>

                                        <Label>
                                            Document Type
                                        </Label>

                                        <Select
                                            value={
                                                form.previous_document_type
                                            }
                                            onValueChange={(v) =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    previous_document_type: v,
                                                }))
                                            }
                                        >

                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Document Type" />
                                            </SelectTrigger>

                                            <SelectContent>

                                                <SelectItem value="offer_letter">
                                                    Offer Letter
                                                </SelectItem>

                                                <SelectItem value="pay_slip">
                                                    Pay Slip
                                                </SelectItem>

                                            </SelectContent>

                                        </Select>

                                    </div>

                                    <div>

                                        <Label>
                                            Upload Document
                                        </Label>

                                        <Input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) =>
                                                setExperienceDoc(
                                                    e.target.files?.[0] || null
                                                )
                                            }
                                        />

                                    </div>

                                    <div>

                                        <Label>
                                            Reporting Manager Name
                                        </Label>

                                        <Input
                                            value={
                                                form.reporting_manager_name
                                            }
                                            onChange={(e) =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    reporting_manager_name:
                                                        e.target.value,
                                                }))
                                            }
                                        />

                                    </div>

                                    <div>

                                        <Label>
                                            Reporting Manager Email
                                        </Label>

                                        <Input
                                            type="email"
                                            value={
                                                form.reporting_manager_email
                                            }
                                            onChange={(e) =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    reporting_manager_email:
                                                        e.target.value,
                                                }))
                                            }
                                        />

                                    </div>

                                    <div>

                                        <Label>
                                            Reporting Manager Phone
                                        </Label>

                                        <Input
                                            value={
                                                form.reporting_manager_phone
                                            }
                                            onChange={(e) =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    reporting_manager_phone:
                                                        e.target.value,
                                                }))
                                            }
                                        />

                                    </div>

                                </>
                            )}

                        </CardContent>

                    </Card>
                )}

                <div
                    className="
        flex
        justify-between
        mt-6
    "
                >

                    <div>

                        {step > 1 && (

                            <Button
                                variant="outline"
                                onClick={() =>
                                    setStep(step - 1)
                                }
                            >
                                Previous
                            </Button>
                        )}

                    </div>

                    <div className="flex gap-3">

                        <Button
                            variant="outline"
                            onClick={() =>
                                onOpenChange(false)
                            }
                        >
                            Cancel
                        </Button>

                        {step < 4 ? (

                            <Button
                                onClick={() =>
                                    setStep(step + 1)
                                }
                            >
                                Next
                            </Button>

                        ) : (

                            <Button
                                disabled={saving}
                                onClick={handleSave}
                            >

                                {
                                    saving
                                        ? (
                                            <>
                                                <Loader2
                                                    className="
                                        mr-2
                                        h-4
                                        w-4
                                        animate-spin
                                    "
                                                />

                                                Saving...
                                            </>
                                        )
                                        : "Create Employee"
                                }

                            </Button>
                        )}

                    </div>

                </div>

            </DialogContent>

        </Dialog>
    );
};

export default EmployeeForm;