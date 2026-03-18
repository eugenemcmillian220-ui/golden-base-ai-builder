'use client';

import { Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';

interface Project {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  code: string;
  deployed_url?: string;
  github_url?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectsListProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

function formatDistanceToNow(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ProjectsList({
  projects,
  activeProject,
  onSelectProject,
  onDeleteProject,
}: ProjectsListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No projects yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectProject(project)}
          className={`p-3 rounded-lg border cursor-pointer transition-all group ${
            activeProject?.id === project.id
              ? 'border-accent bg-accent/10'
              : 'border-border hover:border-accent/50 hover:bg-secondary/30'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                {project.name}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(project.created_at))}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteProject(project.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
