import { db } from '@/db';
import { agents, meetings } from '@/db/schema';
import { polarClient } from '@/lib/polar';
import { 
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init';
import { count, eq } from 'drizzle-orm';


export const premiumRouter = createTRPCRouter({

  getFreeUsage: protectedProcedure.query(async({ ctx }) => {            
    
    const customer = await polarClient.customers.getStateExternal({    // Obtenemos el id del cliente logueado. El id de la cuenta de polar es el id del user de better-auth
      externalId: ctx.auth.user.id,
    })

    const subscription = customer.activeSubscriptions[0];              // Solo obtenemos una suscripción activa (definido en el dashboard de polar)
    
    if(subscription){                                                  // Si el usuario tiene una suscripción activa el procedimiento devuelve null
      return null
    }

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

    return {
      meetingCount: userMeetings.count,                                 // Devolvemos el número de reuniones del usuario
      agentCount: userAgents.count,                                     // Devolvemos el número de agentes del usuario
    }                                                                   // Esto permite a la aplicación saber cuánto ha utilizado de los recursos gratuitos disponibles
  })
})