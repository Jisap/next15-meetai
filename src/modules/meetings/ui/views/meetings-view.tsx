"use client"

import { DataTable } from '@/components/data-table';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { columns } from '../components/columns';
import { EmptyState } from '@/components/empty-state';
import { useRouter } from 'next/navigation';
import { useMeetingsFilter } from '../../hooks/use-meetings-filter';
import { DataPagination } from '@/components/data-pagination';


export const MeetingsView = () => {

  const router = useRouter();
  const [filters, setFilters] = useMeetingsFilter();

  const trpc = useTRPC();
  const baseQueryOptions = trpc.meetings.getMany.queryOptions({...filters});
  const { data } = useSuspenseQuery({                                     // useSuspenseQuery lanza una promesa (recibir datos) y suspende el renderizado hasta que la promesa se resuelva
    ...baseQueryOptions,                                                  // Incluye queryKey, queryFn, etc. desde la configuración de tRPC
    retry: 3,                                                             // Reintentará la consulta hasta 3 veces en caso de error -> evitamos el loop infinito por issue de tanstack #8677
  });


  return (
    <div className='flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4'>
      <DataTable  
        data={data.items}
        columns={columns} 
        onRowClick={(row) => router.push(`/meetings/${row.id}`)}
      />

      <DataPagination 
        page={filters.page}
        totalPages={data.totalPages}
        onPageChange={(page) => setFilters({ page })}
      />

      {data.items.length === 0 && (
        <EmptyState
          title="Create your first meeting"
          description="Create an agent to join your meetings. Each agent will follow your instructions and can interact with participants during the call" />
      )}
    </div>
  )
}

export const MeetingsViewLoading = () => {
  return (
    <div className="flex flex-1 min-h-screen">
      <LoadingState
        title="Loading Meeting"
        description="This may take a few seconds..."
      />
    </div>
  )
}

export const MeetingsViewError = () => {
  return (
    <div className="flex flex-1 min-h-screen">
      <ErrorState
        title="Error Loading Meeting"
        description="Something went wrong. Please try again later."
      />
    </div>
  )
}