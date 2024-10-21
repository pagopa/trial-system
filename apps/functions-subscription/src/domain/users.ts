import * as t from 'io-ts';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

// a unique brand for trial system userId
interface TenantIdBrand {
  // use `unique symbol` here to ensure uniqueness across modules / packages
  readonly TenantId: unique symbol;
}
export const TenantId = t.brand(
  NonEmptyString,
  (str): str is t.Branded<NonEmptyString, TenantIdBrand> => str.length > 0,
  'TenantId',
);
export type TenantId = t.TypeOf<typeof TenantId>;

interface BaseUser {
  readonly id: TenantId;
}

type TrialOwner = BaseUser & {
  readonly type: 'owner';
};

type TrialSubscriber = BaseUser & {
  readonly type: 'subscriber';
};

export type Tenant = TrialOwner | TrialSubscriber;
