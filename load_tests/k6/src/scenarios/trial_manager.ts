//@ts-ignore
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
//@ts-ignore
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.4/index.js";
import { check } from "k6";
import { Trend } from "k6/metrics";
import http from "k6/http";
import { IConfig } from "../utils/config";
import { faker as F } from "@faker-js/faker";

const createSubscriptionDuration = new Trend("post_subscription_duration");
const getSubscriptionDuration = new Trend("get_subscription_duration");

export const trialManagerActivation = async (
  config: IConfig
) => {
  // Create a trial subscription
  const createSubscription = http.post(
    `${config.TRIAL_BASE_URL}/manage/api/v1/trials/${config.TRIAL_ID}/subscriptions`,
    JSON.stringify({
      userId: F.string.alphanumeric(10),
      state: "ACTIVE"
   }),
   {
     headers: {
       Accept: "*/*",
       "Ocp-Apim-Subscription-Key": config.TRIAL_SUBSCRIPTION_KEY,
       "Content-Type": "application/json",
     },
      responseType: "text",
    }
  );
  check(createSubscription, {
    "POST Trials subscription returns 201 or 202": (r) =>
      r.status === 201 || r.status === 202,
  });
  createSubscriptionDuration.add(createSubscription.timings.duration);
};

export const trialManagerGetSub = async (
  config: IConfig
) => {
   // Retrieve users's Trial Subscription
   const getSubscription = http.get(
    `${config.TRIAL_BASE_URL}/manage/api/v1/trials/${config.TRIAL_ID}/subscriptions`,
    {
      headers: {
        Accept: "*/*",
        "Ocp-Apim-Subscription-Key": config.TRIAL_SUBSCRIPTION_KEY,
        "Content-Type": "application/json",
      },
       responseType: "text",
     }
  );
  check(getSubscription, {
    "GET Users's Trial subscription returns 200": (r) => r.status === 200,
  });
  getSubscriptionDuration.add(getSubscription.timings.duration);
}