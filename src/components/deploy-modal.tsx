'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Loader, Check, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface DeployModalProps {
  code: string;
  projectName: string;
  onClose: () => void;
  onDeploy: (url: string) => void;
}

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

  const handleDeploy = async () => {
    try {
      setDeploying(true);
      setError(null);

      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name: projectName,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        toast({
          title: 'Deployment Failed',
          description: data.error,
          variant: 'destructive',
        });
      } else {
        const url = data.url || data.deployment?.url;
        setDeployedUrl(url);
        onDeploy(url);
        toast({
          title: 'Success',
          description: 'Your app has been deployed!',
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Deployment failed';
      setError(errorMsg);
      toast({
        title: 'Error',
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
        className="bg-card border border-border rounded-lg p-6 max-w-md w-full space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold">Deploy to Web</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        {!deployedUrl ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Your app will be deployed to a live URL using Vercel.
              </p>
              <p className="text-xs text-muted-foreground">
                Make sure you have set your VERCEL_TOKEN in environment variables.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm text-destructive">{error}</div>
              </motion.div>
            )}

            <div className="flex gap-3">
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
                  'Deploy Now'
                )}
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
            </div>

            <div>
              <p className="text-sm text-center text-muted-foreground mb-3">
                Your app is now live!
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={deployedUrl}
                  readOnly
                  className="text-xs"
                />
                <Button size="sm" onClick={copyUrl}>
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                asChild
                className="flex-1 gap-2"
              >
                <a href={deployedUrl} target="_blank" rel="noopener noreferrer">
                  Visit App
                </a>
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
