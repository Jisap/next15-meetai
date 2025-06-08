"use client"

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import React from 'react'
import { MeetingIdViewHeader } from '../components/meeting-id-view-header';

interface Props {
  meetingId: string
}


export const MeetingIdView = ({ meetingId }: Props) => {

  const trpc = useTRPC();
  const baseQueryOptions = trpc.meetings.getOne.queryOptions({ id: meetingId });
  const { data } = useSuspenseQuery({                                     // useSuspenseQuery lanza una promesa (recibir datos) y suspende el renderizado hasta que la promesa se resuelva
    ...baseQueryOptions,                                                  // Incluye queryKey, queryFn, etc. desde la configuración de tRPC
    retry: 3,                                                             // Reintentará la consulta hasta 3 veces en caso de error -> evitamos el loop infinito por issue de tanstack #8677
  });

  return (
    <>
      <div className='flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4'>
        <MeetingIdViewHeader 
          meetingId={meetingId}
          meetingName={data.name} 
          onEdit={() => console.log('Edit Meeting')}
          onRemove={() => console.log('Remove Meeting')}
        />
        {JSON.stringify(data, null, 2)}
      </div>
    </>
  )
}

export const MeetingIdViewLoading = () => {
  return (
    <div className="flex flex-1 min-h-screen">
      <LoadingState
        title="Loading Meeting"
        description="This may take a few seconds..."
      />
    </div>
  )
}

export const MeetingIdViewError = () => {
  return (
    <div className="flex flex-1 min-h-screen">
      <ErrorState
        title="Error Loading Meeting"
        description="Something went wrong. Please try again later."
      />
    </div>
  )
}

