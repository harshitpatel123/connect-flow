import { initTracer as initJaegerTracer } from 'jaeger-client';

const JAEGER_ENDPOINT = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';
const SERVICE_NAME = process.env.JAEGER_SERVICE_NAME || 'api-gateway';

export function initTracer() {
  const config = {
    serviceName: SERVICE_NAME,
    sampler: {
      type: 'const',
      param: 1,
    },
    reporter: {
      logSpans: true,
      collectorEndpoint: JAEGER_ENDPOINT,
    },
  };

  const options = {
    logger: {
      info: (msg: string) => console.log('Jaeger INFO:', msg),
      error: (msg: string) => console.error('Jaeger ERROR:', msg),
    },
  };

  return initJaegerTracer(config, options);
}
