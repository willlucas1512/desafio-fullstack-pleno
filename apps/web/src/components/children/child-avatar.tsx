import { bairroAvatarClass, initials } from '@/lib/format';
import type { Child } from '@/lib/types';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-20 w-20 text-2xl',
} as const;

export function ChildAvatar({
  child,
  size = 'md',
  className,
}: {
  child: Pick<Child, 'nome' | 'bairro'>;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold shadow-sm',
        SIZES[size],
        bairroAvatarClass(child.bairro),
        className,
      )}
      aria-hidden="true"
    >
      {initials(child.nome)}
    </div>
  );
}
