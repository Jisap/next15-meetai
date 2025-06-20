import { db } from '@/db';
import { agents, meetings } from '@/db/schema';
import { polarClient } from '@/lib/polar';
import { 
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init';
import { count, eq } from 'drizzle-orm';
import { baseProcedure } from '../../../trpc/init';


export const premiumRouter = createTRPCRouter({

  getCurrentSubscription: protectedProcedure.query(async({ ctx }) => {
    
    const customer = await polarClient.customers.getStateExternal({    // Obtenemos el id del cliente logueado. El id de la cuenta de polar es el id del user de better-auth
      externalId: ctx.auth.user.id,
    })

    const subscription = customer.activeSubscriptions[0];              // Con ese id obtenemos una suscripción activa 
  
    if (!subscription) {                                               // Si el usuario no tiene una suscripción activa el procedimiento devuelve null
      return null
    }                                                                  
  
    const product = await polarClient.products.get({                   // Si si la tiene obtenemos el producto de la suscripción activa
      id: subscription.productId,
    });

    return product;                                                    // Esta función te dice a qué plan o producto está actualmente suscrito el usuario que ha iniciado sesión.
  }),

  getProducts: protectedProcedure.query(async() => {
    
    const products = await polarClient.products.list({                // Obtenemos los productos disponibles en polar 
      isArchived: false,
      isRecurring: true,
      sorting: ["price_amount"]
    });

    return products.result.items;                                      // Esta función te da una lista de todos los productos (planes de suscripción) que tienes configurados y disponibles para la venta en tu dashboard de Polar.    
  }),

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