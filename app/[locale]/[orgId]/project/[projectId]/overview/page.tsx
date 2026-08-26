import ProjectOverview from '@/components/common/projects/details/project-overview';
import Header from '@/components/layout/headers/project/header';
import MainLayout from '@/components/layout/main-layout';
import { ensureDb, getDb } from '@/db/client';
import { getProject } from '@/lib/services/projects-service';
import { notFound } from 'next/navigation';

interface ProjectPageProps {
   params: Promise<{ projectId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: ProjectPageProps) {
   const { projectId } = await params;
   await ensureDb();
   if (!getProject(getDb(), projectId)) {
      notFound();
   }

   return (
      <MainLayout header={<Header projectId={projectId} />}>
         <ProjectOverview projectId={projectId} />
      </MainLayout>
   );
}
