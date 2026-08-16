export class CircuitOpenedEvent {
  constructor(
    public readonly serviceId: string,
    public readonly openedAt: number,
  ) {}
}

export class CircuitClosedEvent {
  constructor(
    public readonly serviceId: string,
    public readonly closedAt: number,
  ) {}
}

export class CircuitHalfOpenEvent {
  constructor(
    public readonly serviceId: string,
    public readonly halfOpenedAt: number,
  ) {}
}
