'use client';

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PremiumTier = 'free' | 'pro' | 'business' | 'enterprise';

interface PremiumBadgeProps {
  tier: PremiumTier;
  requiredTier: PremiumTier;
  className?: string;
  showLock?: boolean;
}

// Tier hierarchy: free < pro < business < enterprise
const TIER_LEVELS: Record<PremiumTier, number> = {
  free: 0,
  pro: 1,
  business: 2,
  enterprise: 3,
};

export function PremiumBadge({
  tier,
  requiredTier,
  className,
  showLock = true,
}: PremiumBadgeProps) {
  const hasAccess = TIER_LEVELS[tier] >= TIER_LEVELS[requiredTier];

  if (hasAccess) {
    return null; // User has access, no badge needed
  }

  const tierLabels: Record<PremiumTier, string> = {
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Enterprise',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        className
      )}
    >
      {showLock && <Lock className="w-3 h-3" />}
      <span>{tierLabels[requiredTier]} only</span>
    </div>
  );
}

export function FeatureLockedOverlay({
  isLocked,
  children,
  className,
}: {
  isLocked: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isLocked) return <>{children}</>;

  return (
    <div className={cn('relative', className)}>
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/30 rounded-lg backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2">
          <Lock className="w-6 h-6 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground text-center">
            Upgrade to access
          </p>
        </div>
      </div>
    </div>
  );
}

interface UpgradePromptProps {
  currentTier: PremiumTier;
  requiredTier: PremiumTier;
  featureName: string;
  onUpgrade?: () => void;
}

export function UpgradePrompt({
  currentTier,
  requiredTier,
  featureName,
  onUpgrade,
}: UpgradePromptProps) {
  const hasAccess = TIER_LEVELS[currentTier] >= TIER_LEVELS[requiredTier];

  if (hasAccess) {
    return null;
  }

  const tierLabels: Record<PremiumTier, string> = {
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Enterprise',
  };

  const tierPricing: Record<PremiumTier, string> = {
    free: '$0',
    pro: '$29/mo',
    business: '$99/mo',
    enterprise: 'Custom',
  };

  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-4">
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100">
            {featureName} is available in {tierLabels[requiredTier]} plan
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
            Upgrade to {tierLabels[requiredTier]} ({tierPricing[requiredTier]}) to unlock this feature and more.
          </p>
          <button
            onClick={onUpgrade}
            className="mt-3 px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for checking feature access
export function useFeatureAccess(
  currentTier: PremiumTier | null | undefined,
  requiredTier: PremiumTier
): boolean {
  const tier = currentTier || 'free';
  return TIER_LEVELS[tier] >= TIER_LEVELS[requiredTier];
}

// Component for wrapping features with access control
interface FeatureGateProps {
  tier: PremiumTier;
  requiredTier: PremiumTier;
  featureName: string;
  fallback?: React.ReactNode;
  onUpgrade?: () => void;
  children: React.ReactNode;
}

export function FeatureGate({
  tier,
  requiredTier,
  featureName,
  fallback,
  onUpgrade,
  children,
}: FeatureGateProps) {
  const hasAccess = useFeatureAccess(tier, requiredTier);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <UpgradePrompt
      currentTier={tier}
      requiredTier={requiredTier}
      featureName={featureName}
      onUpgrade={onUpgrade}
    />
  );
}
