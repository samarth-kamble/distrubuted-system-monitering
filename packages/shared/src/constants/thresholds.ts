export const MONITOR_THRESHOLDS = {
  // Default network timeout in milliseconds
  DEFAULT_TIMEOUT_MS: 5000,
  
  // Minimum allowed interval between monitor checks in seconds
  MIN_INTERVAL_SECONDS: 10,
  
  // Default interval between checks in seconds
  DEFAULT_INTERVAL_SECONDS: 60,
  
  // The number of consecutive failed checks before a monitor is marked as DOWN
  MAX_RETRIES_BEFORE_DOWN: 3,
  
  // Latency in milliseconds above which a monitor is marked as DEGRADED
  DEGRADED_LATENCY_THRESHOLD_MS: 1500,
} as const;
