/**
 * This file is a capabilities mapper, maps a capability to a given key.
 */
import { Clock } from './clock';
import { EventWriter } from './event';
import { HashFn } from './hash';
import {
  SubscriptionReader,
  SubscriptionWriter,
  SubscriptionQueue,
} from './subscription';
import {
  SubscriptionHistoryReader,
  SubscriptionHistoryWriter,
} from './subscription-history';
import {
  ActivationRequestReader,
  ActivationRequestWriter,
} from './activation-request';
import { MonotonicIdFn } from './monotonic-id';
import { ActivationJobReader, ActivationJobWriter } from './activation-job';
import { TrialReader, TrialWriter } from './trial';
import { IdentityWriter } from '../adapters/azure/managed-identity/identity';
import { UUIDFn } from '../adapters/crypto/uuid';
import { EventQueue, EventTopic } from '../adapters/azure/servicebus/event';

/**
 * Maps the capabilities to a given property name. Pick the capability using the
 * `Pick` type utility.
 *
 * E.g.: Pick<Capabilities, 'hashFn' | 'subscriptionReader'>
 */
export interface Capabilities {
  readonly subscriptionReader: SubscriptionReader;
  readonly subscriptionWriter: SubscriptionWriter;
  readonly subscriptionQueue: SubscriptionQueue;
  readonly subscriptionHistoryReader: SubscriptionHistoryReader;
  readonly subscriptionHistoryWriter: SubscriptionHistoryWriter;
  readonly activationJobReader: ActivationJobReader;
  readonly activationJobWriter: ActivationJobWriter;
  readonly activationRequestReader: ActivationRequestReader;
  readonly activationRequestWriter: ActivationRequestWriter;
  readonly trialWriter: TrialWriter;
  readonly trialReader: TrialReader;
  readonly eventWriter: EventWriter;
  readonly eventQueue: EventQueue;
  readonly eventTopic: EventTopic;
  readonly identityWriter: IdentityWriter;
  readonly hashFn: HashFn;
  readonly clock: Clock;
  readonly monotonicIdFn: MonotonicIdFn;
  readonly uuidFn: UUIDFn;
}
