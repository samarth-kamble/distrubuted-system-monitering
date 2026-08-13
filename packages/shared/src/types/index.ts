export enum MonitorType {
  HTTP = 'HTTP',
  TCP = 'TCP',
  PING = 'PING',
  DNS = 'DNS',
}

export enum MonitorStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  PENDING = 'PENDING',
  DEGRADED = 'DEGRADED',
}

export enum IncidentSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SLACK = 'SLACK',
  WEBHOOK = 'WEBHOOK',
  SMS = 'SMS',
}

export interface CheckResult {
  monitorId: string;
  status: MonitorStatus;
  latencyMs: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: Date;
}
