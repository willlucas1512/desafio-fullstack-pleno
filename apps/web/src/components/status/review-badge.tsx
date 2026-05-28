import { Check, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ReviewBadge({ reviewed }: { reviewed: boolean }) {
  return reviewed ? (
    <Badge variant="success" className="gap-1 font-normal">
      <Check className="h-3 w-3" aria-hidden="true" />
      Revisado
    </Badge>
  ) : (
    <Badge variant="warning" className="gap-1 font-normal">
      <Clock className="h-3 w-3" aria-hidden="true" />
      Pendente
    </Badge>
  );
}
