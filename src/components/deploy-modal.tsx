'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Loader, Check, AlertCircle, X, ExternalLink, Copy, Github, Globe, Cloud, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface DeployModalProps {
  code: string;
  projectName: string;
  onClose: () => void;
  onDeploy: (url: string) => void;
}

type Platform = 'vercel' | 'github_pages' | 'netlify' | 'railway';

interface PlatformOption {
  id: Platform;
  name: string;
  icon: any;
  description: string;
  requiresConfig?: boolean;
}

const PLATFORMS: PlatformOption[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    icon: Cloud,
    description: 'Fastest deployment for Next.js apps',
  },
  {
    id: 'github_pages',
    name: 'GitHub Pages',
    icon: Github,
    description: 'Free hosting for static projects',
    requiresConfig: true,
  },
  {
    id: 'netlify',
    name: 'Netlify',
    icon: Globe,
    description: 'Excellent for static sites and functions',
  },
  {
    id: 'railway',
    name: 'Railway',
    icon: Layout,
    description: 'Full-stack application hosting',
  },
];

export function DeployModal({
  code,
  projectName,
  onClose,
  onDeploy,
}: DeployModalProps) {
  const { toast } = useToast();
  const [deploying, setDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>('vercel');
  
  // Platform specific config
  const [githubRepoOwner, setGithubRepoOwner] = useState('');
  const [githubRepoName, setGithubRepoName] = useState(projectName.toLowerCase().replace(/\s+/g, '-'));

  const handleDeploy = async () => {
    try {
      setDeploying(true);
      setError(null);

      const config: any = {};
      if (platform === 'github_pages') {
        if (!githubRepoOwner) {
          throw new Error('GitHub Repository Owner is required');
        }
        config.repoOwner = githubRepoOwner;
        config.repoName = githubRepoName;
      }

      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name: projectName,
          platform,
          config,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Deployment failed');
      }

      const url = data.url || data.deployment?.url;
      setDeployedUrl(url);
      if (url) onDeploy(url);
      
      toast({
        title: 'Success',
        description: `Your app has been deployed to ${platform}!`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Deployment failed';
      setError(errorMsg);
      toast({
        title: 'Deployment Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setDeploying(false);
    }
  };

  const copyUrl = () => {
    if (deployedUrl) {
      navigator.clipboard.writeText(deployedUrl);
      toast({
        title: 'Copied',
        description: 'URL copied to clipboard',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-lg p-6 max-w-lg w-full space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">Deploy Your App</h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        {!deployedUrl ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a platform to deploy your application.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLATFORMS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPlatform(option.id)}
                    className={cn(
                      "flex flex-col items-start p-3 border rounded-lg text-left transition-all hover:bg-accent/50",
                      platform === option.id 
                        ? "border-accent bg-accent/20 ring-1 ring-accent" 
                        : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <option.icon className={cn("w-4 h-4", platform === option.id ? "text-accent" : "text-muted-foreground")} />
                      <span className="font-medium text-sm">{option.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Specific Config */}
            {platform === 'github_pages' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 p-4 bg-accent/10 border border-accent/20 rounded-lg"
              >
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">GitHub Repo Owner</label>
                  <Input 
                    placeholder="username or organization" 
                    value={githubRepoOwner}
                    onChange={(e) => setGithubRepoOwner(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Repository Name</label>
                  <Input 
                    placeholder="my-cool-app" 
                    value={githubRepoName}
                    onChange={(e) => setGithubRepoName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm text-destructive font-medium">{error}</div>
              </motion.div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleDeploy}
                disabled={deploying}
                className="flex-1 gap-2 bg-accent hover:bg-accent/90"
              >
                {deploying ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    Deploy to {PLATFORMS.find(p => p.id === platform)?.name}
                  </>
                )}
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">Successfully Deployed!</h3>
              <p className="text-sm text-muted-foreground">
                Your application is now live on {platform}.
              </p>
            </div>
            
            <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={deployedUrl || ''}
                readOnly
                className="bg-transparent border-none h-auto p-0 text-xs focus-visible:ring-0"
              />
              <Button size="icon" variant="ghost" onClick={copyUrl} className="h-8 w-8">
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                asChild
                className="flex-1 gap-2"
              >
                <a href={deployedUrl || '#'} target="_blank" rel="noopener noreferrer">
                  Visit App
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Close
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
