import { Badge } from '@/components/ui/badge';
import { ALERT_LABEL } from '@/lib/format';
import type { EducationAlert, HealthAlert, SocialAlert } from '@/lib/types';

type AnyAlert = HealthAlert | EducationAlert | SocialAlert;

export function AlertBadge({ code }: { code: AnyAlert }) {
  return (
    <Badge variant="warning" className="font-normal">
      {ALERT_LABEL[code] ?? code}
    </Badge>
  );
}
