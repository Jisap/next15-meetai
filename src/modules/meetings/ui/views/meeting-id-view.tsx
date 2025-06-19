"use client"

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import React, { useState } from 'react'
import { MeetingIdViewHeader } from '../components/meeting-id-view-header';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/use-confirm';
import { UpdateMeetingDialog } from '../components/update-meeting-dialog';
import { UpcommingState } from '../components/upcoming-state';
import { ActiveState } from '../components/active-state';
import { CancelledState } from '../components/cancelled-state';
import { ProcessingState } from '../components/processing-state';
import CompletedState from '../components/completed-state';

interface Props {
  meetingId: string
}


export const MeetingIdView = ({ meetingId }: Props) => {

  const queryClient = useQueryClient();
  const router = useRouter();

  const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Are you sure?",
    "The following action will remove this meeting"
  );

  const trpc = useTRPC();
  const baseQueryOptions = trpc.meetings.getOne.queryOptions({ id: meetingId });
  const { data } = useSuspenseQuery({                                     // useSuspenseQuery lanza una promesa (recibir datos) y suspende el renderizado hasta que la promesa se resuelva
    ...baseQueryOptions,                                                  // Incluye queryKey, queryFn, etc. desde la configuración de tRPC
    retry: 3,                                                             // Reintentará la consulta hasta 3 veces en caso de error -> evitamos el loop infinito por issue de tanstack #8677
  });

  const removeMeeting = useMutation(
    trpc.meetings.remove.mutationOptions({
      onSuccess: async() => {
        await queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}));
        await queryClient.invalidateQueries(
          trpc.premium.getFreeUsage.queryOptions()
        )
        router.push('/meetings');
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const handleRemoveMeeting = async () => {            // Cuando se pulsa el botón de remover
    const ok = await confirmRemove()                   // Se crea la promesa de confirmación -> se abre el dialogo

    if(!ok) return                                     // Se se le da a cancel => promise=false y se cierra el dialogo

    await removeMeeting.mutateAsync({ id: meetingId }) // Si se se le da a confirm => promise=true -> mutation y se cierra el dialogo
  };

  const isActive = data.status === "active";
  const isUpcoming = data.status === "upcoming";
  const isCancelled = data.status === "cancelled";
  const isCompleted = data.status === "completed";
  const isProcessing = data.status === "processing";

  return (
    <>
      <RemoveConfirmation />
      <UpdateMeetingDialog 
        open={updateMeetingDialogOpen} 
        onOpenChange={setUpdateMeetingDialogOpen}
        initialValues={data}
      />
      <div className='flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4'>
        <MeetingIdViewHeader 
          meetingId={meetingId}
          meetingName={data.name} 
          onEdit={() => setUpdateMeetingDialogOpen(true)}
          onRemove={handleRemoveMeeting}
        />
        {isCancelled && <CancelledState />}
        {isProcessing && <ProcessingState />}
        {isCompleted && <CompletedState data={data} />}
        {isUpcoming && (
          <UpcommingState 
            meetingId={meetingId}
            onCancelMeeting={() => {}}
            isCancelling={false}
          />
        )}

        {isActive && (
          <ActiveState 
            meetingId={meetingId}
          />
        )}
        
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

