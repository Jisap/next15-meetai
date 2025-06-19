import { useTRPC } from "@/trpc/client";

//import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MeetingGetOne } from "../../types";
import { meetingsInsertSchema } from "../../schemas";
import { useState } from "react";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog";




interface MeetingFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: MeetingGetOne

}

// MeetingForm es un componente reutilizable que se utiliza para crear y editar meetings
// Si tiene initialValues se editará el meeting, si no se creará un nuevo meeting

export const MeetingForm = ({ onSuccess, onCancel, initialValues }: MeetingFormProps) => {

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false);     // Abre el dialogo para crear un nuevo agente
  const [agentSearch, setAgentSearch] = useState("");                      // Término de búsqueda de agentes

  const agents = useQuery(trpc.agents.getMany.queryOptions({               // Obtenemos los agentes para el select 
    pageSize:100,
    search: agentSearch,
  }))

  // Mutation createAgent
  const createMeeting = useMutation(trpc.meetings.create.mutationOptions({ // useMutation para crear un meeting
    onSuccess: async(data) => {
      
      await queryClient.invalidateQueries(
        trpc.meetings.getMany.queryOptions({})
      ); // Se invalida la consulta de agentes si se crea un nuevo meeting
    
      await queryClient.invalidateQueries(
        trpc.premium.getFreeUsage.queryOptions()
      ); // Se invalida la consulta de premium si se crea un nuevo meeting para actualizar el uso de recursos premium

      onSuccess?.(data.id); // Cierra el dialogo y redirige a la página del nuevo meeting
    },
    onError: (error) => {
      toast.error(error.message);
      //TODO: Chek if error code is "FORBIDDEN" and redirect to /upgrade
    },
    })
  );

  // Mutation updateAgent
  const updateMeeting = useMutation(trpc.meetings.update.mutationOptions({ // useMutation para editar un meeting
    onSuccess: async () => {
      await queryClient.invalidateQueries(
        trpc.meetings.getMany.queryOptions({})
      ); // Se invalida la consulta de agentes si se edita un agente

      if (initialValues?.id) {
        await queryClient.invalidateQueries(
          trpc.meetings.getOne.queryOptions({ id: initialValues.id })
        ); // Se invalida la consulta de un agente específico al ser editado
      }
      onSuccess?.(); // Cierra el dialogo y redirige a la página del meeting actualizado
    },
    onError: (error) => {
      toast.error(error.message);
      //TODO: Chek if error code is "FORBIDDEN" and redirect to /upgrade
    },
  })
  );

  // Form
  const form = useForm<z.infer<typeof meetingsInsertSchema>>({       // useForm para manejar el estado del formulario
    resolver: zodResolver(meetingsInsertSchema),                     // resolver de zod para validar los datos
    defaultValues: {                                                 // Valores por defecto
      name: initialValues?.name ?? "",
      agentId: initialValues?.agentId ?? "",
    }
  });

  const isEdit = !!initialValues?.id;
  const isPending = createMeeting.isPending || updateMeeting.isPending;


  // onSubmit -> envia los datos al backend (mutation)
  const onSubmit = (values: z.infer<typeof meetingsInsertSchema>) => {  // Recibe los datos del formulario y los envía al backend (mutation)
    if(isEdit){
      updateMeeting.mutate({ ...values, id: initialValues?.id });
    }else{
      createMeeting.mutate(values);
    }
  }

  return (
    <>
    <NewAgentDialog 
      open={openNewAgentDialog} 
      onOpenChange={setOpenNewAgentDialog}
    />
      <Form {...form}>
        <form 
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}  
        >
          <FormField 
            name="name"
            control={form.control}
            render={({ field })=> (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g Math Consultations" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="agentId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent</FormLabel>
                <FormControl>
                  <CommandSelect 
                    options={(agents.data?.items ?? []).map((agent) => ({
                      id: agent.id,
                      value: agent.id,
                      children: (
                        <div className="flex items-center gap-x-2">
                          <GeneratedAvatar 
                            seed={agent.name}
                            variant="botttsNeutral"
                            className="border size-6"
                          />
                          <span>{agent.name}</span>
                        </div>
                      )
                    }))}
                    onSelect={field.onChange} // Cuando el usuario selecciona un meeting se llama a field.onChange Esta es una función proporcionada por react-hook-form (a través del render prop de FormField) que actualiza el valor del campo agentId en el estado del formulario.
                    onSearch={setAgentSearch} // Cuando el usuario escribe en el input de búsqueda se llama a setAgentSearch -> provocando que la consulta agents se vuelva a ejecutar con el nuevo filtro.
                    value={field.value}       // El valor actual del campo agentId
                    placeholder="Select an agent"
                    className="w-full"
                  />
                </FormControl>

                <FormDescription>
                  Not found what you&apos;re looking for?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setOpenNewAgentDialog(true)} // Abre el dialogo para crear un nuevo agente
                  >
                    Create new agent
                  </button>
                </FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />
        

          <div className="flex justify-between gap-x-2">
            {onCancel && (
              <Button
                disabled={isPending}
                type="button"
                variant="ghost"
                onClick={() => onCancel()}
              >
                Cancel
              </Button>
            )}

            <Button
              disabled={isPending}
              type="submit"
            >
              {isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}