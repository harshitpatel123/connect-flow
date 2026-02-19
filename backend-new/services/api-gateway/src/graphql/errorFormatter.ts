import { GraphQLError, GraphQLFormattedError } from 'graphql';

export function formatError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  // Hide internal errors in production
  if (process.env.NODE_ENV === 'production') {
    // Don't expose internal server errors
    if (formattedError.message.includes('Internal server error')) {
      return {
        message: 'An unexpected error occurred',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      };
    }
  }

  // Log the error for debugging
  console.error('GraphQL Error:', formattedError);

  // Return formatted error with code
  return {
    message: formattedError.message,
    extensions: {
      code: formattedError.extensions?.code || 'UNKNOWN_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        stacktrace: formattedError.extensions?.stacktrace,
      }),
    },
    ...(formattedError.path && { path: formattedError.path }),
    ...(formattedError.locations && { locations: formattedError.locations }),
  };
}
