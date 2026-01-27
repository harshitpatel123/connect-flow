import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/",
  headers: {
    Authorization:
      typeof window !== "undefined" && localStorage.getItem("token")
        ? `Bearer ${localStorage.getItem("token")}`
        : "",
  },
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
