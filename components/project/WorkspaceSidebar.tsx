"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ProjectActions } from "@/components/project/ProjectActions";
import { ProjectMeta } from "@/components/project/ProjectMeta";
import { RenderPanel } from "@/components/render/RenderPanel";
import type { ProjectRow } from "@/lib/queries/projects";

interface Props {
  project: ProjectRow;
}

/**
 * Tabs-based right sidebar for the workspace. Details holds the static
 * project meta; Renders holds the progress + history; Danger isolates the
 * destructive delete action.
 */
export function WorkspaceSidebar({ project }: Props) {
  return (
    <Tabs defaultValue="details" className="flex h-full min-h-0 flex-col">
      <TabsList className="px-2">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="renders">Renders</TabsTrigger>
        <TabsTrigger value="danger">Danger</TabsTrigger>
      </TabsList>
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
