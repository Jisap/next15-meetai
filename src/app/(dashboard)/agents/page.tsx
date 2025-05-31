import { LoadingState } from "@/components/loading-state";
import { AgentsView, AgentsViewError, AgentViewLoading } from "@/modules/agents/server/ui/views/agents-view"
import { getQueryClient, trpc } from "@/trpc/server"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

const Page = async() => {
  
  const queryClient = getQueryClient();                               // Instancia de QueryClient
  void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions()); // Carga de datos en la cache de QueryClient 

  
  return (
    // dehydrate serializa la cache -> "empaqueta" el estado de la caché para su transporte.
    // HydrationBoundary es una utilidad de TanStack Query recibe el estado serializado de la caché a través la prop state
    // Cuando se carga <AgentsView /> HydrationBoundary se encarga de volver a cargar la caché y "deserializa"/hydrata los datos
    <HydrationBoundary state={dehydrate(queryClient)}>  
      {/* useSuspenseQuery lanza una promsea , y Suspense renderiza el fallback hasta que la promesa se resuelva  */}
      <Suspense fallback={<AgentViewLoading />}>
        <ErrorBoundary fallback={<AgentsViewError />}>
          <AgentsView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  )
}

export default Page