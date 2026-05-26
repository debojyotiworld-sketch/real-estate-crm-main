import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Handshake,
  Users,
  IndianRupee,
  TrendingUp,
  Plus,
  Phone,
  Mail,
  MoreHorizontal,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const partners = [
  {
    id: 1,
    name: "RealEstate Pro",
    contact: "Suresh Menon",
    phone: "+91 98765 43210",
    email: "suresh@realestatepro.com",
    leadsAssigned: 45,
    conversions: 8,
    commission: "₹24L",
    status: "active",
  },
  {
    id: 2,
    name: "Property Hub India",
    contact: "Meena Reddy",
    phone: "+91 87654 32109",
    email: "meena@propertyhub.in",
    leadsAssigned: 32,
    conversions: 5,
    commission: "₹15L",
    status: "active",
  },
  {
    id: 3,
    name: "Home Solutions",
    contact: "Rajiv Sharma",
    phone: "+91 76543 21098",
    email: "rajiv@homesolutions.com",
    leadsAssigned: 28,
    conversions: 4,
    commission: "₹12L",
    status: "active",
  },
  {
    id: 4,
    name: "Prime Properties",
    contact: "Ananya Iyer",
    phone: "+91 65432 10987",
    email: "ananya@primeproperties.in",
    leadsAssigned: 15,
    conversions: 2,
    commission: "₹6L",
    status: "pending",
  },
  {
    id: 5,
    name: "Dream Homes Realty",
    contact: "Vikrant Desai",
    phone: "+91 54321 09876",
    email: "vikrant@dreamhomes.com",
    leadsAssigned: 0,
    conversions: 0,
    commission: "₹0",
    status: "inactive",
  },
];

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-success/10", text: "text-success" },
  pending: { bg: "bg-warning/10", text: "text-warning" },
  inactive: { bg: "bg-muted", text: "text-muted-foreground" },
};

const Partners = () => {
  return (
    <MainLayout
      title="Channel Partners"
      subtitle="Manage broker and channel partner relationships"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Handshake className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Partners</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-info/10 rounded-xl">
                  <Users className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leads via Partners</p>
                  <p className="text-2xl font-bold">320</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">48</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-xl">
                  <IndianRupee className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commission Paid</p>
                  <p className="text-2xl font-bold">₹85L</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Partner
          </Button>
        </div>

        {/* Partners Table */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Partners</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Partner</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Leads Assigned</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                  <TableHead>Commission Earned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => {
                  const status = statusStyles[partner.status];
                  const conversionRate =
                    partner.leadsAssigned > 0
                      ? Math.round(
                          (partner.conversions / partner.leadsAssigned) * 100
                        )
                      : 0;
                  return (
                    <TableRow key={partner.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-accent/10 text-accent">
                              {partner.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{partner.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {partner.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{partner.contact}</p>
                          <p className="text-sm text-muted-foreground">
                            {partner.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {partner.leadsAssigned}
                      </TableCell>
                      <TableCell className="font-medium text-success">
                        {partner.conversions}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                conversionRate >= 15
                                  ? "bg-success"
                                  : conversionRate >= 10
                                  ? "bg-warning"
                                  : "bg-destructive"
                              )}
                              style={{ width: `${Math.min(conversionRate * 4, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{conversionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {partner.commission}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(status.bg, status.text, "border-0 capitalize")}>
                          {partner.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Partners;
