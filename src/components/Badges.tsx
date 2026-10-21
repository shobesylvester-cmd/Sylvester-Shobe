import React from 'react';
import { AlertTriangle, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { UrgencyLevel, RequestStatus } from '../types/classifier.ts';

export const UrgencyBadge: React.FC<{ urgency: UrgencyLevel; size?: 'sm' | 'md' }> = ({
  urgency,
  size = 'md',
}) => {
  const config = {
    Low: {
      color: 'bg-slate-500/15 text-slate-300 border-slate-600/40',
      icon: Clock,
    },
    Medium: {
      color: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
      icon: Clock,
    },
    High: {
      color: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
      icon: AlertCircle,
    },
    Critical: {
      color: 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse',
      icon: ShieldAlert,
    },
  }[urgency];

  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-md border ${config.color} ${padding}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{urgency}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case 'New':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'Triaged':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'In Progress':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Escalated':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${getStyle()}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80"></span>
      {status}
    </span>
  );
};
