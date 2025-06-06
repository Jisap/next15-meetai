"use client"

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';


export const MeetingsView = () => {

  const trpc = useTRPC();
  const baseQueryOptions = trpc.meetings.getMany.queryOptions({});
  const { data } = useSuspenseQuery({                                     // useSuspenseQuery lanza una promesa (recibir datos) y suspende el renderizado hasta que la promesa se resuelva
    ...baseQueryOptions,                                                  // Incluye queryKey, queryFn, etc. desde la configuración de tRPC
    retry: 3,                                                             // Reintentará la consulta hasta 3 veces en caso de error -> evitamos el loop infinito por issue de tanstack #8677
  });


  return (
    <div className='overflow-x-scroll'>
      {JSON.stringify(data, null, 2)}
    </div>
  )
}

export const MeetingsViewLoading = () => {
  return (
    <div className="flex flex-1 min-h-screen">
      <LoadingState
        title="Loading Agent"
        description="This may take a few seconds..."
      />
    </div>
  )
}

export const MeetingsViewError = () => {
  return (
    <div className="flex flex-1 min-h-screen">
      <ErrorState
        title="Error Loading Agents"
        description="Something went wrong. Please try again later."
      />
    </div>
  )
}