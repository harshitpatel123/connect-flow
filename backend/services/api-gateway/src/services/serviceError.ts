import { GraphQLError } from 'graphql';

export function handleServiceError(error: any, context: string): never {
  const message = error?.response?.data?.error || error?.response?.data?.message || error.message;
  const status = error?.response?.status || 500;

  const code =
    status === 401 ? 'UNAUTHENTICATED' :
    status === 403 ? 'FORBIDDEN' :
    status === 404 ? 'NOT_FOUND' :
    status === 400 ? 'BAD_USER_INPUT' :
    'INTERNAL_SERVER_ERROR';

  console.error(`[API-GATEWAY] ❌ ${context} failed (${status}): ${message}`);

  throw new GraphQLError(message, { extensions: { code } });
}
