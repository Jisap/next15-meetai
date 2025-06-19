import { useTRPC } from "@/trpc/client";
import { AgentGetOne } from "../../types";
//import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { agentsInsertSchema } from "../../schemas";
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
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";



interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentGetOne;

}

// AgentForm es un componente reutilizable que se utiliza para crear y editar agentes
// Si tiene initialValues se editará el agente, si no se creará un nuevo agente

export const AgentForm = ({ onSuccess, onCancel, initialValues }: AgentFormProps) => {

  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Mutation createAgent
  const createAgent = useMutation(trpc.agents.create.mutationOptions({ // useMutation para crear un agente
    onSuccess: async() => {
      
      await queryClient.invalidateQueries(
        trpc.agents.getMany.queryOptions({})
      ); // Se invalida la consulta de agentes si se crea un nuevo agente
    
      await queryClient.invalidateQueries(
        trpc.premium.getFreeUsage.queryOptions()
      ); // Se invalida la consulta de premium si se crea un nuevo agente para actualizar el uso de recursos premium

      onSuccess?.(); // Cierra el dialogo
    },
    onError: (error) => {
      toast.error(error.message);
      if (error.data?.code === "FORBIDDEN") {
        router.push("/upgrade");
      }
    },
    })
  );

  // Mutation updateAgent
  const updateAgent = useMutation(trpc.agents.update.mutationOptions({ // useMutation para editar un agente
    onSuccess: async () => {
      await queryClient.invalidateQueries(
        trpc.agents.getMany.queryOptions({})
      ); // Se invalida la consulta de agentes si se edita un agente

      if (initialValues?.id) {
        await queryClient.invalidateQueries(
          trpc.agents.getOne.queryOptions({ id: initialValues.id })
        ); // Se invalida la consulta de un agente específico al ser editado
      }
      onSuccess?.(); // Cierra el dialogo
    },
    onError: (error) => {
      toast.error(error.message);  
    },
  })
  );

  // Form
  const form = useForm<z.infer<typeof agentsInsertSchema>>({         // useForm para manejar el estado del formulario
    resolver: zodResolver(agentsInsertSchema),                       // resolver de zod para validar los datos
    defaultValues: {                                                 // Valores por defecto
      name: initialValues?.name ?? "",
      instructions: initialValues?.instructions ?? "",
    }
  });

  const isEdit = !!initialValues?.id;
  const isPending = createAgent.isPending || updateAgent.isPending;


  // onSubmit -> envia los datos al backend (mutation)
  const onSubmit = (values: z.infer<typeof agentsInsertSchema>) => {  // Recibe los datos del formulario y los envía al backend (mutation)
    if(isEdit){
      updateAgent.mutate({ ...values, id: initialValues?.id });
    }else{
      createAgent.mutate(values);
    }
  }

  return (
    <Form {...form}>
      <form 
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}  
      >
        <GeneratedAvatar 
          seed={form.watch("name")} // Se utiliza el nombre del agente como semilla para generar el avatar
          variant="botttsNeutral"
          className="border size-16"
        />

        <FormField 
          name="name"
          control={form.control}
          render={({ field })=> (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g John Doe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField 
          name="instructions"
          control={form.control}
          render={({ field })=> (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="You are a helpful assistant that can answer questions and help with assignments." /> 
              </FormControl>
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
  )
}