import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCounter } from '@/hooks/useCounter';
import { useMemo } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
  animate?: boolean;
  key?: string; // Chave para reiniciar animação
}

const variantStyles = {
  default: 'from-primary/20 to-secondary/20',
  primary: 'from-primary/30 to-primary/10',
  success: 'from-success/30 to-success/10',
  danger: 'from-destructive/30 to-destructive/10',
  warning: 'from-warning/30 to-warning/10',
};

const iconStyles = {
  default: 'bg-gradient-to-br from-primary to-secondary text-primary-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-success/20 text-success',
  danger: 'bg-destructive/20 text-destructive',
  warning: 'bg-warning/20 text-warning',
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  animate = true,
  key,
}: StatsCardProps) {
  // Extrair número do valor para animação - melhor regex para capturar apenas o número principal
  const numericValue = typeof value === 'number' ? value :
    typeof value === 'string' ?
      // Para tempo (formato HH:MM:SS), não animar
      (value.includes(':') ? 0 : parseInt(value.replace(/[^\d]/g, '')) || 0) :
      0;

  // Verificar se é um valor de tempo para não animar
  const isTimeValue = typeof value === 'string' && value.includes(':');

  // Usar chave única para reiniciar animação quando dados mudam
  const animationKey = useMemo(() => key || `${title}-${numericValue}`, [title, numericValue, key]);

  const { count, isAnimating } = useCounter({
    end: numericValue,
    duration: 2000,
    start: 0,
    key: animationKey
  });

  // Formatar o valor animado - apenas para números, não para tempo
  const displayValue = animate && !isNaN(numericValue) && numericValue > 0 && !isTimeValue ?
    count.toLocaleString('pt-BR') :
    value;

  return (
    <div className={cn('stat-card animate-fade-in', className)}>
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-20', variantStyles[variant])} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconStyles[variant])}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <span className={cn(
              'text-sm font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className={cn(
            'text-3xl font-bold transition-all duration-300',
            isAnimating && 'text-primary'
          )}>
            {displayValue}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
