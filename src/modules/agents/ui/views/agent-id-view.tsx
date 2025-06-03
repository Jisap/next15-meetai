"use client"

import { useTRPC } from '@/trpc/client';
import { trpc } from '../../../../trpc/server';
import { useSuspenseQuery } from '@tanstack/react-query';


interface Props {
  agentId: string;
}


export const AgentIdView = ({ agentId }: Props) => {
  
  const trpc = useTRPC();

  // const { data } = useSuspenseQuery(trpc.agents.getOne.queryOptions({ id: agentId }));
  
  const baseQueryOptions = trpc.agents.getOne.queryOptions({ id: agentId });
  const { data } = useSuspenseQuery({
    ...baseQueryOptions,
    retry: 3,
  });
  
  return (
    <div className='flex-1 py-4 md:px-8 flex flex-col gap-y-4'>
      {JSON.stringify(data, null, 2)}
    </div>
  )
}