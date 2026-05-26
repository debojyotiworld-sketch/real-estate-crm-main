import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Phone,
  MapPin,
  FileText,
  Users,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tasks = [
  {
    id: 1,
    title: "Follow-up call with Rahul Sharma",
    type: "call",
    time: "10:00 AM",
    priority: "high",
    completed: false,
  },
  {
    id: 2,
    title: "Site visit - Green Heights with Priya",
    type: "visit",
    time: "11:30 AM",
    priority: "high",
    completed: false,
  },
  {
    id: 3,
    title: "Send brochure to Amit Kumar",
    type: "document",
    time: "2:00 PM",
    priority: "medium",
    completed: false,
  },
  {
    id: 4,
    title: "Team meeting - Weekly review",
    type: "meeting",
    time: "4:00 PM",
    priority: "medium",
    completed: false,
  },
  {
    id: 5,
    title: "Call back - Vikram Singh inquiry",
    type: "call",
    time: "5:30 PM",
    priority: "low",
    completed: true,
  },
];

const typeIcons: Record<string, typeof Phone> = {
  call: Phone,
  visit: MapPin,
  document: FileText,
  meeting: Users,
};

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

export function UpcomingTasks() {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Today's Tasks</h3>
          <p className="text-sm text-muted-foreground">Follow-ups and site operations</p>
        </div>
        <Badge variant="secondary" className="bg-accent/10 text-accent">
          {tasks.filter((t) => !t.completed).length} pending
        </Badge>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => {
          const Icon = typeIcons[task.type];
          return (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-transparent p-2 table-row-hover hover:border-border/60 sm:gap-3 sm:p-3",
                task.completed && "opacity-50"
              )}
            >
              <Checkbox
                checked={task.completed}
                className="border-muted-foreground data-[state=checked]:bg-success data-[state=checked]:border-success"
              />
              <div
                className={cn(
                  "p-2 rounded-lg",
                  task.completed ? "bg-muted" : "bg-accent/10"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    task.completed ? "text-muted-foreground" : "text-accent"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    task.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  )}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {task.time}
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn("text-xs capitalize", priorityStyles[task.priority])}
              >
                {task.priority}
              </Badge>
            </div>
          );
        })}
      </div>
      <Button
        variant="ghost"
        className="w-full mt-4 text-accent hover:text-accent hover:bg-accent/5"
      >
        View All Tasks
      </Button>
    </div>
  );
}
