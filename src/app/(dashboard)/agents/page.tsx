import { LoadingState } from "@/components/loading-state";
import { auth } from "@/lib/auth";
import { AgentListHeader } from "@/modules/agents/ui/components/agent-list-header";
import { AgentsView, AgentsViewError, AgentViewLoading } from "@/modules/agents/ui/views/agents-view"
import { getQueryClient, trpc } from "@/trpc/server"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

const Page = async() => {

  const session = await auth.api.getSession({ // Cuando se hace login, se guarda la sesión en la cookie
    headers: await headers()                  // Los headers acceden a la cookie y con ella se obtiene la sesión
  })

  if (!session) {
    redirect('/sign-in')
  }
  
  const queryClient = getQueryClient();                                 // Instancia de QueryClient
  void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions({})); // Carga de datos en la cache de QueryClient 

  
  return (
    // dehydrate serializa la cache -> "empaqueta" el estado de la caché para su transporte.
    // HydrationBoundary es una utilidad de TanStack Query recibe el estado serializado de la caché a través la prop state
    // Cuando se carga <AgentsView /> HydrationBoundary se encarga de volver a cargar la caché y "deserializa"/hydrata los datos
    <>
      <AgentListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>  
        {/* useSuspenseQuery lanza una promsea , y Suspense renderiza el fallback hasta que la promesa se resuelva  */}
        <Suspense fallback={<AgentViewLoading />}>
          <ErrorBoundary fallback={<AgentsViewError />}>
            <AgentsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  )
}

export default Page