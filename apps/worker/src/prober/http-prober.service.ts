import { Injectable, Logger } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';
import { performance } from 'perf_hooks';
import { CheckStatus } from '@prisma/client';

export interface ProbeResult {
  status: CheckStatus;
  responseCode?: number;
  responseTimeMs?: number;
  dnsLookupTimeMs?: number;
  connectionTimeMs?: number;
  errorMessage?: string;
}

@Injectable()
export class HttpProberService {
  private readonly logger = new Logger(HttpProberService.name);

  async probe(
    url: string,
    method: string = 'GET',
    timeoutMs: number = 5000,
  ): Promise<ProbeResult> {
    return new Promise((resolve) => {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        return resolve({
          status: CheckStatus.ERROR,
          errorMessage: `Invalid URL: ${error.message || 'Parsing failed'}`,
          responseTimeMs: 0,
        });
      }

      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const timings: {
        start: number;
        lookup?: number;
        connect?: number;
        secureConnect?: number;
        end?: number;
      } = {
        start: performance.now(),
      };

      let dnsLookupTimeMs = 0;
      let connectionTimeMs = 0;
      let resolved = false;

      const options: http.RequestOptions = {
        method: method.toUpperCase(),
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        timeout: timeoutMs,
        agent: false, // Bypass keep-alive to measure TCP connection setup every check
      };

      const req = client.request(options, (res) => {
        // Consume response stream to end request cleanly
        res.on('data', () => {});
        res.on('end', () => {
          if (resolved) return;
          resolved = true;

          const end = performance.now();
          const totalResponseTimeMs = Math.round(end - timings.start);

          if (timings.lookup) {
            dnsLookupTimeMs = Math.round(timings.lookup - timings.start);
          }

          if (timings.connect) {
            const connectStart = timings.lookup || timings.start;
            connectionTimeMs = Math.round(timings.connect - connectStart);
          }

          const statusCode = res.statusCode || 0;
          const status =
            statusCode >= 200 && statusCode < 400
              ? CheckStatus.SUCCESS
              : CheckStatus.FAILURE;

          resolve({
            status,
            responseCode: statusCode,
            responseTimeMs: totalResponseTimeMs,
            dnsLookupTimeMs,
            connectionTimeMs,
          });
        });
      });

      req.on('socket', (socket) => {
        socket.on('lookup', () => {
          timings.lookup = performance.now();
        });

        socket.on('connect', () => {
          timings.connect = performance.now();
        });

        if (isHttps) {
          socket.on('secureConnect', () => {
            timings.secureConnect = performance.now();
          });
        }
      });

      req.on('error', (err: Error & { code?: string }) => {
        if (resolved) return;
        resolved = true;

        const end = performance.now();
        const totalResponseTimeMs = Math.round(end - timings.start);

        let status: CheckStatus = CheckStatus.ERROR;
        let errorMessage: string = err.message || 'Unknown network error';

        if (
          err.code === 'ETIMEDOUT' ||
          err.code === 'ESOCKETTIMEDOUT' ||
          err.name === 'TimeoutError'
        ) {
          status = CheckStatus.TIMEOUT;
          errorMessage = `Timeout of ${timeoutMs}ms exceeded`;
        } else if (err.code === 'ENOTFOUND') {
          status = CheckStatus.FAILURE;
          errorMessage = `DNS lookup failed: host '${parsedUrl.hostname}' not found`;
        }

        resolve({
          status,
          responseTimeMs: totalResponseTimeMs,
          errorMessage,
        });
      });

      req.on('timeout', () => {
        req.destroy(new Error('timeout'));
      });

      req.end();
    });
  }
}
