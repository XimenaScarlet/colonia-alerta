# Resumen de Cambios para Vercel & Prisma

He modificado los archivos directamente en el proyecto. Aquí está el código final de los archivos más importantes, junto con las instrucciones para continuar.

## 1. Resumen de lo que se cambió:
- **Prisma a PostgreSQL:** Se actualizó `prisma/schema.prisma` para usar `postgresql` y no usar archivos locales `.db`.
- **Singleton de Prisma:** Se creó `src/lib/prisma.ts` y se importó en todos los archivos del proyecto (API routes y páginas) en lugar de instanciar `new PrismaClient()`.
- **Arreglo de Auth:** En `src/lib/auth.ts` se eliminaron listeners de desconexión incompatibles, se usó el singleton y se mejoró la captura de errores (`P2002` para emails duplicados).
- **Arreglo de Build de Next.js:** Se borraron las fuentes locales `GeistVF.woff` faltantes en `src/app/layout.tsx` y se agregó `export const dynamic = "force-dynamic"` en las páginas que hacían queries a Prisma (Home y Estadísticas) para que no rompan el SSG. También se cerró correctamente la sintaxis JSX en `home/page.tsx`.
- **Arreglo del Mapa:** Se extrajo el contenido dinámico de `src/app/mapa/page.tsx` a un wrapper de cliente (`src/components/MapClientWrapper.tsx`) validando su correcta importación.

---

## 2. Comandos que debes correr después:

Asegúrate de configurar la variable `DATABASE_URL` en tu `.env` (o `.env.production`) y localmente apuntarla a tu instancia de Postgres (por ejemplo, Supabase o Neon).

```bash
# 1. Instalar variables guardando los cambios
npm install

# 2. Generar el nuevo cliente prisma compatible con PostgreSQL
npx prisma generate

# 3. Aplicar el esquema a tu base de datos postgres (y crear las tablas)
npx prisma db push

# 4. Probar que el build ahora pasa
npm run build
```

---

## 3. Archivos Editados Completos (Referencia)

A continuación te dejo el código final de los principales archivos modificados en tu código local:

### `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?
  access_token       String?
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  password      String?   // Para Credentials provider
  image         String?
  accounts      Account[]
  sessions      Session[]
  reports       Report[]  // Relación con reportes creados
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Report {
  id          String   @id @default(uuid())
  title       String
  description String
  category    String   // Bache, Luminaria Dañada, Basura Acumulada, Fuga de Agua, Inseguridad, Otro
  municipio   String   // Saltillo, Ramos Arizpe
  colonia     String
  lat         Float
  lng         Float
  priority    String   // Baja, Media, Alta
  status      String   @default("Pendiente") // Pendiente, En Proceso, Resuelto
  photoB64    String?
  createdBy   String?  // ID del usuario (User.id) - opcional si usuario se elimina
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  resolvedAt  DateTime? // Fecha cuando se marcó como resuelto
  
  user        User?     @relation(fields: [createdBy], references: [id], onDelete: SetNull)
  
  @@index([status])
  @@index([category])
  @@index([municipio])
  @@index([colonia])
  @@index([createdBy])
  @@index([createdAt])
}
```

### `src/lib/prisma.ts` (NUEVO ARCHIVO)
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### `src/lib/auth.ts`
```typescript
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
```

### `src/components/MapClientWrapper.tsx`
```typescript
"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Cargar el mapa dinámicamente porque usa APIs del navegador no disponibles en servidor (Window/Document)
const MapComponent = dynamic(
  () => import('@/components/MapComponent'),
  { ssr: false }
);

export function MapClientWrapper() {
  return (
    <Suspense fallback={<div>Cargando mapa...</div>}>
      <MapComponent />
    </Suspense>
  );
}
```

### `src/app/mapa/page.tsx`
```typescript
import { MapClientWrapper } from '@/components/MapClientWrapper';

export default function MapPage() {
  return (
    <div className="h-[calc(100vh-7.5rem)] w-full relative">
      <MapClientWrapper />
      
      {/* Botón flotante para crear reporte en la ubicación actual */}
      <div className="absolute bottom-6 right-4 z-[400]">
        <button className="bg-sky-600 text-white p-4 rounded-full shadow-lg hover:bg-sky-500 transition-colors flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
    </div>
  );
}
```

*(Nota: También se actualizó el layout, las rutas API y las páginas de reportes con reemplazos equivalentes usando el Singleton y agregando `force-dynamic` a las páginas necesarias).*
