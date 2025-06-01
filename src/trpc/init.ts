import { auth } from '@/lib/auth';
import { initTRPC, TRPCError } from '@trpc/server';
import { headers } from 'next/headers';
import { cache } from 'react';

/**
 * Crea el contexto para cada solicitud tRPC.
 * Este contexto está disponible en todos tus procedimientos tRPC.
 * Utiliza `react`'s `cache` para asegurar que la función se ejecute una vez por solicitud.
 * @returns Un objeto de contexto, aquí con un `userId` de ejemplo.
 */
export const createTRPCContext = cache(async () => { 
  return { userId: 'user_123' };
});

/**
 * Inicialización de la instancia de tRPC.
 * Esta es la base para construir tus routers y procedimientos.
 */
const t = initTRPC.create({});

// Base router and procedure helpers
/** Helper para crear routers tRPC. Es un alias para `t.router`. */
export const createTRPCRouter = t.router;

/** Helper para crear un "caller" del lado del servidor. Útil para llamar procedimientos internamente o en pruebas. Es un alias para `t.createCallerFactory`. */
export const createCallerFactory = t.createCallerFactory;

/** Procedimiento base público. Úsalo para construir tus queries, mutations y subscriptions. Es un alias para `t.procedure`. */
export const baseProcedure = t.procedure;

/** Procedimiento protegido. Extiende de baseProcedure e incluye la session del usuario */
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({ ctx: { ...ctx, auth: session } });
});



