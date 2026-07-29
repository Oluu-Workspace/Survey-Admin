import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { projectsAPI } from '@/services/api';
import { mapProjectFromApi, type ResearchProject } from '@/domain/project';
import { Stamp } from '@/components/Stamp';
import { Button } from '@/components/ui/button';

const ProjectDetail = () => {
  const { projectId = '' } = useParams();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    void (async () => {
      setLoading(true);
      try {
        const data = await projectsAPI.getById(projectId);
        setProject(mapProjectFromApi(data.project));
      } catch {
        toast.error('Project not found');
        setProject(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-sm text-muted-foreground">Project not found.</p>;
  }

  const surveys = (project.surveys || []) as { id: string; title?: string; status?: string }[];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/dashboard/projects" className="text-xs text-muted-foreground hover:text-foreground">
            ← Projects
          </Link>
          <h2 className="mt-1 font-display text-xl font-semibold">{project.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
        </div>
        <Stamp status={project.status} />
      </div>

      <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
        {[
          { label: 'Client', value: project.client },
          { label: 'PI', value: project.principal_investigator },
          { label: 'Responses', value: String(project.responses_count ?? 0) },
        ].map((m) => (
          <div key={m.label} className="bg-card px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{m.label}</div>
            <div className="mt-1 text-sm font-medium">{m.value || '—'}</div>
          </div>
        ))}
      </div>

      <section>
        <h3 className="font-display text-xs uppercase tracking-wide text-muted-foreground">
          Surveys in this project
        </h3>
        <ul className="mt-2 divide-y divide-border border border-border bg-card">
          {surveys.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">No surveys linked yet.</li>
          ) : (
            surveys.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <Link
                  to={`/dashboard/surveys/${s.id}?tab=data`}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  {s.title || s.id}
                </Link>
                <Stamp status={s.status || 'draft'} />
              </li>
            ))
          )}
        </ul>
      </section>

      {surveys.length === 1 ? (
        <Button asChild variant="outline" className="rounded-sm">
          <Link to={`/dashboard/data?survey=${surveys[0].id}`}>Open survey data</Link>
        </Button>
      ) : surveys.length > 1 ? (
        <p className="text-sm text-muted-foreground">
          Open a survey above to explore its field data and analytics.
        </p>
      ) : null}
    </div>
  );
};

export default ProjectDetail;
