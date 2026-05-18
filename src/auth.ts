import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  InactiveAccountError,
  InvalidEmailPasswordError,
} from "./utils/errors";

import { sendRequest } from "./utils/api";
import { IUser } from "./types/next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },

      authorize: async (credentials) => {
        const res = await sendRequest<IBackendRes<ILogin>>({
          method: "POST",
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/login`,
          body: {
            email: credentials.username,
            password: credentials.password,
          },
        });

        if (
          res.statusCode === 201 ||
          res.statusCode === 200
        ) {
          return {
            _id: res.data?.user?._id,
            name: res.data?.user?.name,
            email: res.data?.user?.email,
            access_token: res.data?.access_token,
            role: res.data?.user?.role,
          };
        }

        if (+res.statusCode === 401) {
          throw new InvalidEmailPasswordError();
        }

        if (+res.statusCode === 400) {
          throw new InactiveAccountError();
        }

        throw new Error("Internal server error");
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
  },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.user = user as any;
      }

      return token;
    },

    session({ session, token }) {
      (session.user as any) = token.user;

      return session;
    },

    authorized: async ({ auth, request }) => {
      const isLoggedIn = !!auth;

      const pathname = request.nextUrl.pathname;

      const isAdminRoute = pathname.startsWith("/dashboard");

      if (isAdminRoute) {
        return isLoggedIn && auth?.user?.role === "ADMIN";
      }

      return true;
    },
  },
});