import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, MoreHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const statusStyles: Record<string, string> = {
  new: "lead-status-new",
  hot: "lead-status-hot",
  warm: "lead-status-warm",
  cold: "lead-status-cold",
  converted: "lead-status-converted",
};

export function RecentLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentLeads = async () => {
      try {
        setLoading(true);
        // Database theke latest 5 ta leads anchi
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setLeads(data || []);
      } catch (error) {
        console.error("Error fetching recent leads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentLeads();
  }, []);

  // Safe initials generator handle null/empty names
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getStatusStyle = (status: string | null) => {
    const s = (status || "new").toLowerCase();
    return statusStyles[s] || "lead-status-new"; 
  };

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
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No recent leads found.
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center gap-2 rounded-lg border border-transparent p-2 table-row-hover hover:border-border/60 sm:gap-4 sm:p-3"
            >
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                <AvatarFallback className="bg-accent/10 text-accent text-sm font-medium">
                  {getInitials(lead.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">
                    {lead.name || "Unknown Lead"}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn("text-xs capitalize", getStatusStyle(lead.status))}
                  >
                    {lead.status || "New"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {/* Property er detail na thakle requirement dekhabo */}
                  {lead.property_type || lead.requirements || "No property specified"}
                </p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm text-muted-foreground">{lead.source || "Direct"}</p>
                <p className="text-xs text-muted-foreground">
                  {lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }) : ''}
                </p>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {/* Phone icon hover korle number dekhabe */}
                <Button variant="ghost" size="icon" className="w-7 h-7 sm:w-8 sm:h-8" title={lead.phone}>
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
          ))
        )}
      </div>
    </div>
  );
}