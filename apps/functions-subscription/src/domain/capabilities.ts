/**
 * This file is a capabilities mapper, maps a capability to a given key.
 */
import { Clock } from './clock';
import { HashFn } from './hash';
import { SubscriptionReader, SubscriptionWriter } from './subscription';
import { SubscriptionHistoryWriter } from './subscription-history';
import { SubscriptionRequestWriter } from './subscription-request';
import { ActivationRequestRepository } from './activation-request';

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
  readonly subscriptionHistoryWriter: SubscriptionHistoryWriter;
  readonly activationRequestRepository: ActivationRequestRepository;
  readonly hashFn: HashFn;
  readonly clock: Clock;
}
