import { FeatureScenarioType } from '../config';
import { getSubscription } from './get-subscription';
import { postSubscription } from './post-subscription';

export const getScenario = (scenarioType: FeatureScenarioType) => {
  switch (scenarioType) {
    case 'TRIAL_MANAGER_ACTIVATION':
      return postSubscription;
    case 'TRIAL_MANAGER_GET_SUB':
      return getSubscription;
  }
};
