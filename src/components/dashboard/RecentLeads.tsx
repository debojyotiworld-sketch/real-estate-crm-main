import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const leads = [
  {
    id: 1,
    name: "Rahul Sharma",
    phone: "+91 98765 43210",
    source: "Facebook Ads",
    status: "hot",
    property: "Sky Villas, 3 BHK",
    time: "2 hours ago",
  },
  {
    id: 2,
    name: "Priya Patel",
    phone: "+91 87654 32109",
    source: "Website",
    status: "new",
    property: "Green Heights, 2 BHK",
    time: "4 hours ago",
  },
  {
    id: 3,
    name: "Amit Kumar",
    phone: "+91 76543 21098",
    source: "Walk-in",
    status: "warm",
    property: "Palm Residency, 4 BHK",
    time: "Yesterday",
  },
  {
    id: 4,
    name: "Sneha Reddy",
    phone: "+91 65432 10987",
    source: "Google Ads",
    status: "converted",
    property: "Lake View Towers, 3 BHK",
    time: "2 days ago",
  },
  {
    id: 5,
    name: "Vikram Singh",
    phone: "+91 54321 09876",
    source: "Referral",
    status: "cold",
    property: "Metro Heights, 2 BHK",
    time: "3 days ago",
  },
];

const statusStyles: Record<string, string> = {
  new: "lead-status-new",
  hot: "lead-status-hot",
  warm: "lead-status-warm",
  cold: "lead-status-cold",
  converted: "lead-status-converted",
};

export function RecentLeads() {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Recent Leads</h3>
          <p className="text-sm text-muted-foreground">Latest inquiries needing attention</p>
        </div>
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
          View All
        </Button>
      </div>
      <div className="space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center gap-2 rounded-lg border border-transparent p-2 table-row-hover hover:border-border/60 sm:gap-4 sm:p-3"
          >
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
              <AvatarFallback className="bg-accent/10 text-accent text-sm font-medium">
                {lead.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground truncate">
                  {lead.name}
                </p>
                <Badge
                  variant="outline"
                  className={cn("text-xs capitalize", statusStyles[lead.status])}
                >
                  {lead.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {lead.property}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm text-muted-foreground">{lead.source}</p>
              <p className="text-xs text-muted-foreground">{lead.time}</p>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Button variant="ghost" size="icon" className="w-7 h-7 sm:w-8 sm:h-8">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="w-7 h-7 sm:w-8 sm:h-8 hidden sm:flex">
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="w-7 h-7 sm:w-8 sm:h-8">
                <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
