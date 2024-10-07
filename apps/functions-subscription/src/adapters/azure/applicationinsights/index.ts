import * as appInsights from 'applicationinsights';
import { Config } from '../../../config';

const getApplicationInsightsClient = () => appInsights.defaultClient;

export const startApplicationInsights = ({
  connectionString,
  samplingPercentage = 30, // Set 30 as default value if undefined
}: Config['applicationInsights']) => {
  const ai = appInsights
    .setup(connectionString)
    .setAutoCollectConsole(true)
    .setSendLiveMetrics(false)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);

  const client = getApplicationInsightsClient();
  // eslint-disable-next-line functional/immutable-data,functional/no-expression-statements
  client.config.samplingPercentage = samplingPercentage;

  return ai.start();
};
