import { useMemo, useState } from "react";
import { BriefcaseBusiness, CalendarDays, CircleCheckBig, FileText, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface ResignationForm {
  employeeName: string;
  employeeId: string;
  reason: string;
  lastWorkingDay: string;
}

const initialFormState: ResignationForm = {
  employeeName: "",
  employeeId: "",
  reason: "",
  lastWorkingDay: "",
};

const formFields: Array<keyof ResignationForm> = [
  "employeeName",
  "employeeId",
  "reason",
  "lastWorkingDay",
];

const Resignation = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ResignationForm>(initialFormState);
  const [submitted, setSubmitted] = useState(false);

  const daysUntilExit = useMemo(() => {
    if (!formData.lastWorkingDay) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exitDate = new Date(formData.lastWorkingDay);
    exitDate.setHours(0, 0, 0, 0);

    return Math.ceil((exitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [formData.lastWorkingDay]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setSubmitted(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const hasEmptyField = formFields.some((field) => !formData[field].trim());
    if (hasEmptyField) {
      toast({
        title: "Incomplete resignation form",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    console.log("Resignation Submitted:", formData);

    toast({
      title: "Resignation submitted",
      description: "Your request has been captured and shared with HR for review.",
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            <CircleCheckBig className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Resignation Submitted</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Your resignation request has been successfully submitted. HR can now review your details and begin the exit process.
            </p>
          </div>
          <div className="grid w-full max-w-2xl gap-3 rounded-xl border bg-background/80 p-4 text-left md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Employee Name</p>
              <p className="font-medium">{formData.employeeName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Employee ID</p>
              <p className="font-medium">{formData.employeeId}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Last Working Day</p>
              <p className="font-medium">{formData.lastWorkingDay}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Notice Period</p>
              <p className="font-medium">
                {daysUntilExit === null
                  ? "Not specified"
                  : daysUntilExit >= 0
                    ? `${daysUntilExit} day${daysUntilExit === 1 ? "" : "s"} remaining`
                    : `${Math.abs(daysUntilExit)} day${Math.abs(daysUntilExit) === 1 ? "" : "s"} overdue`}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Reason</p>
              <p className="font-medium">{formData.reason}</p>
            </div>
          </div>
          <Button onClick={resetForm}>Submit Another Request</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Resignation Form</CardTitle>
          <CardDescription>
            Submit your resignation details so HR can review your request and coordinate the exit process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input
                  id="employeeName"
                  name="employeeName"
                  placeholder="Enter employee name"
                  value={formData.employeeName}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  name="employeeId"
                  placeholder="Enter employee ID"
                  value={formData.employeeId}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Share the reason for resignation"
                className="min-h-[140px] resize-none"
                value={formData.reason}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastWorkingDay">Last Working Day</Label>
              <Input
                id="lastWorkingDay"
                type="date"
                name="lastWorkingDay"
                min={new Date().toISOString().split("T")[0]}
                value={formData.lastWorkingDay}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">
                Choose the intended final working date to help HR plan notice and handover.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row">
              <Button type="submit">Submit Resignation</Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-border/60 bg-muted/20">
          <CardHeader>
            <CardTitle className="text-lg">Request Snapshot</CardTitle>
            <CardDescription>Live preview of the details being submitted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border bg-background p-4">
              <UserRound className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Employee</p>
                <p className="font-medium">{formData.employeeName || "Name will appear here"}</p>
                <p className="text-sm text-muted-foreground">{formData.employeeId || "Employee ID pending"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border bg-background p-4">
              <CalendarDays className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Last Working Day</p>
                <p className="font-medium">{formData.lastWorkingDay || "Select a date"}</p>
                <p className="text-sm text-muted-foreground">
                  {daysUntilExit === null
                    ? "Notice period will be estimated once a date is selected."
                    : daysUntilExit >= 0
                      ? `${daysUntilExit} day${daysUntilExit === 1 ? "" : "s"} from today`
                      : "Selected date is in the past"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border bg-background p-4">
              <FileText className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Resignation Reason</p>
                <p className="font-medium leading-6">
                  {formData.reason || "Your resignation reason will be shown here for quick review."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
              Exit Checklist
            </CardTitle>
            <CardDescription>Helpful reminders before submitting the request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="rounded-lg border bg-muted/30 px-4 py-3">
              Confirm your project handover plan and pending deliverables with your reporting manager.
            </p>
            <p className="rounded-lg border bg-muted/30 px-4 py-3">
              Review leave balance, final payroll dependencies, and any company assets that need to be returned.
            </p>
            <p className="rounded-lg border bg-muted/30 px-4 py-3">
              Keep your last working day aligned with your notice policy unless HR has approved an exception.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Resignation;
