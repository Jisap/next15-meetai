import { ResponsiveDialog } from "@/components/responsive-dialog";




interface NewMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewMeetingDialog = ({ open, onOpenChange }: NewMeetingDialogProps) => {
  return (
    <ResponsiveDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title="New Meeting"
      description="Create a new meeting"
    >
      TODO: Meeting Form
    </ResponsiveDialog>
  )
}