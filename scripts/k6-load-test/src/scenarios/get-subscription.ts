import { check } from 'k6';
import { Trend } from 'k6/metrics';
import http from 'k6/http';
import { Config } from '../config';
import { faker as F } from '@faker-js/faker';

const getSubscriptionDurationMetric = new Trend('get_subscription_duration');

export const getSubscription = async (config: Config) => {
  const userId = F.string.alphanumeric(10);
  const request = http.get(
    `${config.TRIAL_BASE_URL}/manage/api/v1/trials/${config.TRIAL_ID}/subscriptions/${userId}`,
    {
      headers: {
        Accept: '*/*',
        'Ocp-Apim-Subscription-Key': config.TRIAL_SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'text',
    },
  );
  check(request, {
    'GET subscription returns 200': (r) => r.status === 200,
  });
  getSubscriptionDurationMetric.add(request.timings.duration);
};
