import { check } from 'k6';
import { Trend } from 'k6/metrics';
import http from 'k6/http';
import { Config } from '../config';
import { faker as F } from '@faker-js/faker';

const postSubscriptionDurationMetric = new Trend('post_subscription_duration');

export const postSubscription = async (config: Config) => {
  const request = http.post(
    `${config.TRIAL_BASE_URL}/manage/api/v1/trials/${config.TRIAL_ID}/subscriptions`,
    JSON.stringify({
      userId: F.string.alphanumeric(10),
      state: 'ACTIVE',
    }),
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
    'POST subscription returns 201 or 202': (r) =>
      r.status === 201 || r.status === 202,
  });

  postSubscriptionDurationMetric.add(request.timings.duration);
};
