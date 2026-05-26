import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/MainLayout";
import BlogsTable from "@/components/cms/BlogsTable";


export default function Cms() {
  return (
    <MainLayout title="CMS" subtitle="Manage your content">
      <Tabs defaultValue="blogs" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="blogs">Blogs</TabsTrigger>
        </TabsList>

        <TabsContent value="blogs" className="mt-6"><BlogsTable /></TabsContent>
      </Tabs>
    </MainLayout>
  );
}
