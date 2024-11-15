import * as t from 'io-ts';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

// a unique brand for trial system tenantId
interface TenantIdBrand {
  // use `unique symbol` here to ensure uniqueness across modules / packages
  readonly TenantId: unique symbol;
}
export const TenantIdCodec = t.brand(
  NonEmptyString,
  (str): str is t.Branded<NonEmptyString, TenantIdBrand> => str.length > 0,
  'TenantId',
);
export type TenantId = t.TypeOf<typeof TenantIdCodec>;

interface BaseUser {
  readonly id: TenantId;
}

type TrialOwner = BaseUser & {
  readonly type: 'owner';
};

type TrialSubscriber = BaseUser & {
  readonly type: 'subscriber';
};

type Support = BaseUser & {
  readonly type: 'support';
};

export type Tenant = TrialOwner | TrialSubscriber | Support;
