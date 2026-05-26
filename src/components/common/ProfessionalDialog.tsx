import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ProfessionalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ProfessionalDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: ProfessionalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("p-0 overflow-hidden sm:max-w-[640px]", className)}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b bg-card px-6 py-4">
          <DialogTitle className="text-xl tracking-tight">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-sm">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className={cn("px-6 py-5", contentClassName)}>{children}</div>

        {footer ? (
          <DialogFooter className="border-t bg-card px-6 py-4 gap-2">{footer}</DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
