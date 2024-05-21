import { Clock } from '../../domain/clock';

export const clock: Clock = {
  now: () => new Date(),
};
