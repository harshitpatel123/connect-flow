import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql",
});

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  const isInvalidToken =
    graphQLErrors?.some((e) => e.message === "Invalid token") ||
    networkError?.result?.error === "Invalid token";

  if (isInvalidToken && typeof window !== "undefined") {
    localStorage.clear();
    window.location.href = "/auth/login";
  }
});

export const apolloClient = new ApolloClient({
  link: errorLink.concat(authLink).concat(httpLink),
  cache: new InMemoryCache(),
});
