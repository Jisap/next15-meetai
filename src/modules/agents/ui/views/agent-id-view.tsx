"use client"

import { useTRPC } from '@/trpc/client';
import { trpc } from '../../../../trpc/server';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { AgentIdViewHeader } from '../components/agent-id-view-header';
import { GeneratedAvatar } from '@/components/generated-avatar';
import { Badge } from '@/components/ui/badge';
import { VideoIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/use-confirm';
import { useState } from 'react';
import { UpdateAgentDialog } from '../components/update-agent-dialog';


interface Props {
  agentId: string;
}


export const AgentIdView = ({ agentId }: Props) => {

  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);

  // const { data } = useSuspenseQuery(trpc.agents.getOne.queryOptions({ id: agentId }));

  const baseQueryOptions = trpc.agents.getOne.queryOptions({ id: agentId });
  const { data } = useSuspenseQuery({
    ...baseQueryOptions,
    retry: 3,
  });

  const removeAgent = useMutation(
    trpc.agents.remove.mutationOptions({
      onSuccess: async() => {
        await queryClient.invalidateQueries(trpc.agents.getMany.queryOptions({}));
        // TODO: invalidate free tier usage
        router.push('/agents');
      },
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      }
    })
  );

  //       ConfirmationDialog, confirm
  const [RemovedConfirmation, confirmRemove] = useConfirm(
    "Are you sure?",
    `The following action will remove ${data.meetingCount} associated meeting`
  );

  const handleRemoveAgent = async () => {           // Cuando se pulsa el botón de remover
    const ok = await confirmRemove()                // Se crea la promesa de confirmación -> se abre el dialogo

    if(!ok) return                                  // Se se le da a cancel => promise=false y se cierra el dialogo

    await removeAgent.mutateAsync({ id: agentId })  // Si se se le da a confirm => promise=true -> mutation y se cierra el dialogo
  }

  return (
    <>
      <RemovedConfirmation />
      <UpdateAgentDialog 
        open={updateAgentDialogOpen}
        onOpenChange={setUpdateAgentDialogOpen}
        initialValues={data}
      />
      <div className='flex-1 py-4 md:px-8 flex flex-col gap-y-4'>
        <AgentIdViewHeader
          agentId={agentId}
          agentName={data.name}
          onEdit={() => setUpdateAgentDialogOpen(true)} // Se abre el dialogo de edición <updateAgentDialog>
          onRemove={handleRemoveAgent}                  // Se abre el dialogo de confirmación <RemovedConfirmation>
        />

        <div className='bg-white rounded-lg border'>
          <div className='px-4 py-5 gap-y-5 flex flex-col col-span-5'>
            <div className='flex items-center gap-x-3'>
              <GeneratedAvatar
                variant="botttsNeutral"
                seed={data.name}
                className='size-10'
              />

              <h2 className='text-2xl font-medium'>
                {data.name}
              </h2>
            </div>

            <Badge
              variant="outline"
              className='flex items-center gap-x-2 [&>svg]:size-4'
            >
              <VideoIcon className='text-blue-700'/>
              {data.meetingCount} {data.meetingCount === 1 ? 'Meeting' : 'Meetings'}
            </Badge>

            <div className='flex flex-col gap-y-4'>
              <p className='text-lg font-medium'>
                Instructions
              </p>
              <p className='text-neutral-800'>
                {data.instructions}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export const AgentIdViewLoading = () => {
  return (
    <div className="flex flex-1 min-h-screen">
      <LoadingState
        title="Loading Agent"
        description="This may take a few seconds..."
      />
    </div>
  )
}

export const AgentsIdViewError = () => {
  return (
    <div className="flex flex-1 min-h-screen">
      <ErrorState
        title="Error Loading Agent"
        description="Something went wrong. Please try again later."
      />
    </div>
  )
}