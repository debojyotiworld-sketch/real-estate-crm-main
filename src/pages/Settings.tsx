import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/MainLayout";
import RolesTable from "@/components/settings/RolesTable";
import { PermissionsTable } from "@/components/settings/PermissionTable";
import { ModulesTable } from "@/components/settings/ModulesTable";
import { CompanySettings } from "@/components/settings/CompanySettings";
import SalesZonesTable from "@/components/settings/SalesZonesTable";
import BranchesTable from "@/components/settings/BranchesTable";
import ApiTable from "@/components/settings/ApiTable";

export default function Settings() {
  return (
    <MainLayout title="Settings" subtitle="Manage company, roles, permissions, and module settings">
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="role">Roles</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="permission">Permissions</TabsTrigger>
          <TabsTrigger value="zones">Sales-Zones</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6"><CompanySettings /></TabsContent>
        <TabsContent value="branches" className="mt-6"><BranchesTable /></TabsContent>
        <TabsContent value="role" className="mt-6"><RolesTable /></TabsContent>
        <TabsContent value="permission" className="mt-6"><PermissionsTable /></TabsContent>
        <TabsContent value="modules" className="mt-6"><ModulesTable /></TabsContent>
        <TabsContent value="zones" className="mt-6"><SalesZonesTable /></TabsContent>
        <TabsContent value="api" className="mt-6"><ApiTable /></TabsContent>
      </Tabs>
    </MainLayout>
  );
}
