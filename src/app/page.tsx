'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Download, Zap, Loader, Check, AlertCircle, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { CodeEditor } from '@/components/code-editor';
import { ProjectsList } from '@/components/projects-list';
import { DeployModal } from '@/components/deploy-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [deployingProject, setDeployingProject] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Load projects on mount
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  // Fetch projects from Supabase
  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.data) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate code from prompt using OpenAI
  const generateApp = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGeneratingCode(true);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (data.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
      } else {
        setCode(data.code);
        toast({
          title: 'Success',
          description: 'Code generated successfully!',
        });
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate code',
        variant: 'destructive',
      });
    } finally {
      setGeneratingCode(false);
    }
  };

  // Save project to Supabase
  const saveProject = async () => {
    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'No code to save',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingProject(true);
      const projectName = prompt.slice(0, 50) || 'Untitled Project';

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          prompt,
          code,
        }),
      });

      const data = await res.json();
      if (data.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
      } else {
        setActiveProject(data.data);
        await loadProjects();
        toast({
          title: 'Success',
          description: 'Project saved successfully!',
        });
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Error',
        description: 'Failed to save project',
        variant: 'destructive',
      });
    } finally {
      setSavingProject(false);
    }
  };

  // Copy code to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied',
        description: 'Code copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy code',
        variant: 'destructive',
      });
    }
  };

  // Export code as HTML file
  const exportCode = () => {
    if (!code.trim()) return;

    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeProject?.name || 'app'}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: 'Success',
      description: 'Code exported as HTML',
    });
  };

  // Delete project
  const deleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadProjects();
        if (activeProject?.id === projectId) {
          setActiveProject(null);
          setCode('');
        }
        toast({
          title: 'Success',
          description: 'Project deleted',
        });
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  // Load project
  const loadProject = (project: Project) => {
    setActiveProject(project);
    setCode(project.code);
    setPrompt(project.prompt);
  };

  // Create new project
  const createNewProject = () => {
    setActiveProject(null);
    setCode('');
    setPrompt('');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Golden Base</h1>
              <p className="text-sm text-muted-foreground">AI Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Projects */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold">Projects</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={createNewProject}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                New
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : (
              <ProjectsList
                projects={projects}
                activeProject={activeProject}
                onSelectProject={loadProject}
                onDeleteProject={deleteProject}
              />
            )}
          </motion.aside>

          {/* Main Editor Area */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-9 space-y-6"
          >
            {/* Prompt Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Describe your app</label>
              <Textarea
                placeholder="e.g., Create a beautiful todo list app with dark mode, animations, and local storage"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32 font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={generateApp}
                  disabled={generatingCode || !prompt.trim()}
                  className="flex-1 gap-2 bg-accent hover:bg-accent/90"
                >
                  {generatingCode ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Code Editor & Preview Grid */}
            {code && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Code Editor */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium font-display">Generated Code</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyToClipboard}
                        className="gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={exportCode}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                  <CodeEditor code={code} onChange={setCode} />
                </motion.div>

                {/* Live Preview */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-medium font-display">Live Preview</h3>
                  <div className="border border-border rounded-lg overflow-hidden bg-card h-96">
                    <iframe
                      srcDoc={code}
                      className="w-full h-full border-0"
                      title="Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </motion.div>
              </div>
            )}

            {/* Action Buttons */}
            {code && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <Button
                  onClick={saveProject}
                  disabled={savingProject}
                  variant="default"
                  className="flex-1 gap-2"
                >
                  {savingProject ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Project'
                  )}
                </Button>
                <Button
                  onClick={() => setShowDeployModal(true)}
                  variant="secondary"
                  className="flex-1 gap-2"
                >
                  Deploy to Web
                </Button>
              </motion.div>
            )}

            {/* Empty State */}
            {!code && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-2 border-dashed border-border rounded-lg p-12 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-accent/10 rounded-lg mx-auto flex items-center justify-center">
                  <Zap className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-semibold">No code generated yet</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Describe your app idea and click Generate to start
                  </p>
                </div>
              </motion.div>
            )}
          </motion.main>
        </div>
      </div>

      {/* Deploy Modal */}
      <AnimatePresence>
        {showDeployModal && (
          <DeployModal
            code={code}
            projectName={activeProject?.name || 'app'}
            onClose={() => setShowDeployModal(false)}
            onDeploy={async (url) => {
              if (activeProject) {
                await fetch(`/api/projects/${activeProject.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ deployed_url: url }),
                });
              }
              setShowDeployModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
