
import {  createTRPCRouter } from '../init';
import { agentsRouter } from '@/modules/agents/server/procedures';


/**
 * Router principal de la aplicación.
 * Aquí se agrupan todos los sub-routers y procedimientos de tu API.
 */
export const appRouter = createTRPCRouter({ 
  agents: agentsRouter,
});

// export type definition of API
/** Tipo inferido del `appRouter`. Se utiliza en el cliente para obtener tipado de extremo a extremo. */
export type AppRouter = typeof appRouter;