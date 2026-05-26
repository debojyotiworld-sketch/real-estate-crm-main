import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, Car } from "lucide-react";
import { cn } from "@/lib/utils";

const visits = [
  {
    id: 1,
    client: "Rahul Sharma",
    property: "Sky Villas",
    time: "11:00 AM",
    status: "upcoming",
    executive: "Ravi Kumar",
  },
  {
    id: 2,
    client: "Priya Patel",
    property: "Green Heights",
    time: "2:30 PM",
    status: "in-progress",
    executive: "Sneha Mehta",
  },
  {
    id: 3,
    client: "Amit Kumar",
    property: "Palm Residency",
    time: "9:00 AM",
    status: "completed",
    executive: "Raj Verma",
  },
];

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  upcoming: {
    bg: "bg-info/10",
    text: "text-info",
    label: "Upcoming",
  },
  "in-progress": {
    bg: "bg-warning/10",
    text: "text-warning",
    label: "In Progress",
  },
  completed: {
    bg: "bg-success/10",
    text: "text-success",
    label: "Completed",
  },
};

export function SiteVisitsToday() {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Site Visits Today</h3>
          <p className="text-sm text-muted-foreground">Scheduled property visits</p>
        </div>
        <Badge variant="secondary" className="bg-accent/10 text-accent">
          {visits.length} scheduled
        </Badge>
      </div>
      <div className="space-y-3">
        {visits.map((visit) => {
          const status = statusStyles[visit.status];
          return (
            <div
              key={visit.id}
              className="flex items-start gap-2 rounded-lg border border-transparent p-2 table-row-hover hover:border-border/60 sm:gap-3 sm:p-3"
            >
              <div className={cn("p-2 rounded-lg mt-0.5", status.bg)}>
                <MapPin className={cn("w-4 h-4", status.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">
                    {visit.property}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", status.bg, status.text, "border-0")}
                  >
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  Client: {visit.client}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {visit.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Avatar className="w-4 h-4">
                      <AvatarFallback className="text-[8px] bg-accent/10 text-accent">
                        {visit.executive
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {visit.executive}
                    </span>
                  </div>
                </div>
              </div>
              <Car className="w-5 h-5 text-muted-foreground" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
