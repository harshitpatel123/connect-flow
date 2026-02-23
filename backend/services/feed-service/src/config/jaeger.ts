import jaegerClient from 'jaeger-client';

const SERVICE_NAME = 'feed-service';

export function initTracer() {
  const config = {
    serviceName: SERVICE_NAME,
    sampler: {
      type: 'const',
      param: 1,
    },
    reporter: {
      logSpans: true,
      agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
      agentPort: parseInt(process.env.JAEGER_AGENT_PORT || '6831'),
    },
  };

  const options = {
    logger: {
      info: (msg: string) => console.log('[Jaeger]', msg),
      error: (msg: string) => console.error('[Jaeger]', msg),
    },
  };

  return jaegerClient.initTracer(config, options);
}

export const tracer = initTracer();
