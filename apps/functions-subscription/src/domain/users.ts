interface BaseUser {
  readonly id: string;
}

type TrialOwner = BaseUser & {
  readonly type: 'owner';
};

type TrialSubscriber = BaseUser & {
  readonly type: 'subscriber';
};

export type User = TrialOwner | TrialSubscriber;
