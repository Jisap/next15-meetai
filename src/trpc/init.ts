import { initTRPC } from '@trpc/server';
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