/**
 * This file is a capabilities mapper, maps a capability to a given key.
 */
import { Clock } from './clock';
import { EventWriter } from './event';
import { HashFn } from './hash';
import { SubscriptionReader, SubscriptionWriter } from './subscription';
import {
  SubscriptionHistoryReader,
  SubscriptionHistoryWriter,
} from './subscription-history';
import { SubscriptionRequestWriter } from './subscription-request';
import {
  ActivationRequestReader,
  ActivationRequestWriter,
} from './activation-request';
import { MonotonicIdFn } from './monotonic-id';
import { ActivationJobReader, ActivationJobWriter } from './activation-job';
import { TrialWriter } from './trial';

/**
 * Maps the capabilities to a given property name. Pick the capability using the
 * `Pick` type utility.
 *
 * E.g.: Pick<Capabilities, 'hashFn' | 'subscriptionReader'>
 */
export interface Capabilities {
  readonly subscriptionReader: SubscriptionReader;
  readonly subscriptionWriter: SubscriptionWriter;
  readonly subscriptionRequestWriter: SubscriptionRequestWriter;
  readonly subscriptionHistoryReader: SubscriptionHistoryReader;
  readonly subscriptionHistoryWriter: SubscriptionHistoryWriter;
  readonly activationJobReader: ActivationJobReader;
  readonly activationJobWriter: ActivationJobWriter;
  readonly activationRequestReader: ActivationRequestReader;
  readonly activationRequestWriter: ActivationRequestWriter;
  readonly trialWriter: TrialWriter;
  readonly eventWriter: EventWriter;
  readonly hashFn: HashFn;
  readonly clock: Clock;
  readonly monotonicIdFn: MonotonicIdFn;
}
