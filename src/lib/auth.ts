import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

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

    try {
      // Si es registro
      if (credentials.isRegister === "true") {
        // Verificar que el usuario no exista
        const existingUser = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (existingUser) {
          throw new Error("El email ya está registrado");
        }

        // Crear usuario nuevo
        const hashedPassword = await bcrypt.hash(credentials.password as string, 10);
        const newUser = await prisma.user.create({
          data: {
            email: credentials.email as string,
            name: credentials.name as string || (credentials.email as string).split("@")[0],
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
        where: { email: credentials.email as string },
      });

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      if (!user.password) {
        throw new Error("Usuario sin contraseña configurada");
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password as string,
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
    } catch (dbError: any) {
      console.error('Prisma DB Error:', dbError);
      
      if (dbError.code === 'P2002') {
        throw new Error("El email ya está registrado");
      }
      if (dbError.code === 'P1001' || dbError.code?.startsWith('P1')) {
        throw new Error("Error de conexión a la base de datos");
      }
      
      throw new Error("Error de base de datos: " + (dbError.message || "Intenta de nuevo"));
    }
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

export default authOptions;
