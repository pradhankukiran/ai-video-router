"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { PaneHeader } from "@/components/project/PaneHeader";
import { ProjectActions } from "@/components/project/ProjectActions";
import { ProjectMeta } from "@/components/project/ProjectMeta";
import { RenderPanel } from "@/components/render/RenderPanel";
import type { ProjectRow } from "@/lib/queries/projects";

interface Props {
  project: ProjectRow;
}

export function WorkspaceSidebar({ project }: Props) {
  return (
    <Tabs defaultValue="details" className="flex h-full min-h-0 flex-col">
      <PaneHeader index={3} label="Workspace">
        <TabsList className="!border-b-0 -mx-4 flex-1 gap-2 px-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="renders">Renders</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>
      </PaneHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TabsContent value="details">
          <ProjectMeta project={project} />
        </TabsContent>
        <TabsContent value="renders">
          <RenderPanel projectId={project.id} />
        </TabsContent>
        <TabsContent value="danger">
          <ProjectActions projectId={project.id} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
