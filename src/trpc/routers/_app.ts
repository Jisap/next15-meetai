
import { meetings } from '@/db/schema';
import {  createTRPCRouter } from '../init';
import { agentsRouter } from '@/modules/agents/server/procedures';
import { meetingsRouter } from '@/modules/meetings/server/procedures';
import { premiumRouter } from '@/modules/premium/server/procedures';


/**
 * Router principal de la aplicación.
 * Aquí se agrupan todos los sub-routers y procedimientos de tu API.
 */
export const appRouter = createTRPCRouter({ 
  agents: agentsRouter,
  meetings: meetingsRouter,
  premium: premiumRouter
});

// export type definition of API
/** Tipo inferido del `appRouter`. Se utiliza en el cliente para obtener tipado de extremo a extremo. */
export type AppRouter = typeof appRouter;