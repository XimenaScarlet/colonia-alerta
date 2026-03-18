import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
        name: { label: "Nombre", type: "text" },
        isRegister: { label: "isRegister", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña requeridos");
        }

        // Si es registro
        if (credentials.isRegister === "true") {
          // Verificar que el usuario no exista
          const existingUser = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (existingUser) {
            throw new Error("El email ya está registrado");
          }

          // Crear usuario nuevo
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const newUser = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.name || credentials.email.split("@")[0],
              password: hashedPassword,
            },
          });

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          };
        }

        // Si es login
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        if (!user.password) {
          throw new Error("Usuario sin contraseña configurada");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Contraseña incorrecta");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session && session.user) {
        (session.user as any).id = token.id || token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "secret-key-development",
};
