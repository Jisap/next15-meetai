


import { ResponsiveDialog } from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';
import { JSX, useState } from 'react';

export const useConfirm = (
  title: string,
  description: string,
): [
  () => JSX.Element,
  () => Promise<unknown>,
] => {

  const [promise, setPromise] = useState<{ 
    resolve: (value: boolean) => void       // Referencia a una función Resolve de una promise
  } | null>(null);                          // Cuando promise es !== null hay una confirmación pendiente

  const confirm = () => {                   // Cuando se llama a confirm() 
    return new Promise((resolve) => {       // se crea una nueva promise (detiene el flujo en el componente donde se llama y no se restablece hasta que se resuelve)  
      setPromise({ resolve });              // y se guarda su resolve en el estado
    });
  }

  const handleClose = () => {               // Click en el botón de cierre -> resuelve la promesa a null
    setPromise(null);
  }

  const handleConfirm = () => {             // Click en el botón de confirmación -> resuelve la promesa a true
    promise?.resolve(true)
    handleClose()
  }

  const handleCancel = () => {              // Click en el botón de cancelación -> resuelve la promesa a false
    promise?.resolve(false)
    handleClose()
  }

  const confirmationDialog = () => (        // Envuelve todo el componente de dialogo
    <ResponsiveDialog
      open={promise !== null}               // Cuando se crea la promesa se abre el dialogo
      onOpenChange={handleClose}
      title={title}
      description={description}
    >
      <div className='pt-4 w-full flex flex-col-reverse gap-y-2 lg:flex-row gap-x-2 items-center justify-end'>
        <Button
          onClick={handleCancel}
          variant="outline"
          className='w-full lg:w-auto'
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          className='w-full lg:w-auto'
        >
          Confirm
        </Button>
      </div>
    </ResponsiveDialog>
  )

  return [confirmationDialog, confirm]

}