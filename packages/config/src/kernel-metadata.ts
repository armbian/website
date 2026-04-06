export interface KernelBranchConfig {
  key: string;
  label: string;
  badgeColor: string;
}

export const KERNEL_BRANCHES: Record<string, KernelBranchConfig> = {
  current: { key: 'current', label: 'Current', badgeColor: '#10b981' },
  edge: { key: 'edge', label: 'Edge', badgeColor: '#ef4444' },
  legacy: { key: 'legacy', label: 'Legacy', badgeColor: '#6b7280' },
  vendor: { key: 'vendor', label: 'Vendor', badgeColor: '#8b5cf6' },
};

export function getKernelBranchConfig(branch: string): KernelBranchConfig | undefined {
  const key = branch.toLowerCase();
  return KERNEL_BRANCHES[key];
}
