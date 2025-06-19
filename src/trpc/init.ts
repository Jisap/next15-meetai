import { db } from '@/db';
import { agents, meetings } from '@/db/schema';
import { auth } from '@/lib/auth';
import { polarClient } from '@/lib/polar';
import { MAX_FREE_AGENTS, MAX_FREE_MEETINGS } from '@/modules/premium/constants';
import { initTRPC, TRPCError } from '@trpc/server';
import { count, eq } from 'drizzle-orm';
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

/** Middleware para proteger ciertas rutas o acciones verificando si un usuario ha alcanzado los límites de uso gratuitos */
export const premiumProcedure = (entity: "meetings" | "agents") =>     // Recibe una entity que puede ser "meetings" o "agents"
  
  protectedProcedure.use(async({ ctx, next }) => {                     // Se basa en el protectedProcedure para verificar si el usuario está logueado
    
    const customer = await polarClient.customers.getStateExternal({    // Obtenemos el id del cliente logueado. El id de la cuenta de polar es el id del user de better-auth
      externalId: ctx.auth.user.id,
    });

    const [userMeetings] = await db                                    // Obtenemos el número de reuniones del usuario
      .select({
        count: count(meetings.id)
      })
      .from(meetings)
      .where(
        eq(meetings.userId, ctx.auth.user.id)
      )

    const [userAgents] = await db                                       // Obtenemos el número de agentes del usuario
      .select({
        count: count(agents.id)
      })
      .from(agents)
      .where(
        eq(agents.userId, ctx.auth.user.id)
      )

    const isPremium = customer.activeSubscriptions.length > 0;                  // Se determina si el usuario es "premium" verificando si tiene alguna suscripción activa en Polar
    const isFreeAgentLimitReached = userAgents.count >= MAX_FREE_AGENTS;        // Se verifica si el usuario ha alcanzado el límite de agentes gratuitos
    const isFreeMeetingLimitReached = userMeetings.count >= MAX_FREE_MEETINGS;  // Se verifica si el usuario ha alcanzado el límite de reuniones de

    const shouldThrowMeetingError =                                             // Se verifica si el usuario ha alcanzado el límite de reuniones de
      entity === "meetings" && isFreeMeetingLimitReached && !isPremium;

    const shouldThrowAgentError =                                               // Se verifica si el usuario ha alcanzado el límite de agentes gratuitos
      entity === "agents" && isFreeAgentLimitReached && !isPremium;
  
    if (shouldThrowMeetingError) {                                              // Lanzamiento de Errores Específicos: 
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You have reached your meeting limit"
      })
    }

    if(shouldThrowAgentError){
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You have reached your agent limit"
      })
    }

    return next({ ctx: {...ctx, customer }}); // Si no se lanza ningún error se ejecuta next con el contexto enriquecido con el objeto customer
  })                                          // De esta manera los procedimientos trpc que utilicen premiumProcedure tendrán accceso a la info del cliente de Polar



