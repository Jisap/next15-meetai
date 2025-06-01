import { ResponsiveDialog } from "@/components/responsive-dialog";



interface NewAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewAgentDialog = ({ open, onOpenChange }: NewAgentDialogProps) => {
  return (
    <ResponsiveDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title="New Agent"
      description="Create a new agent"
    >
      new agent form
    </ResponsiveDialog>
  )
}