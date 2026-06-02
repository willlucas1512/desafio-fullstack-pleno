import type { Summary } from '../domain/summary.js';
import type { ChildrenStore } from '../repositories/children-store.js';

export {
  alertsByAreaSchema,
  alertsByNeighborhoodSchema,
  summarySchema,
  type AlertsByArea,
  type AlertsByNeighborhood,
  type Summary,
} from '../domain/summary.js';

export class SummaryService {
  constructor(private readonly repo: ChildrenStore) {}

  build(): Promise<Summary> {
    return this.repo.summary();
  }
}
