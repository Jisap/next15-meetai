import { authClient } from "@/lib/auth-client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GeneratedAvatar } from "@/components/generated-avatar";





export const DashboardUserButton = () => {

  const { data, isPending } = authClient.useSession();
  if(isPending || !data?.user){
    return null
  }

  console.log('User image URL:', data.user.image); 

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden"
      >
        {data.user.image ? (
          <Avatar>
            <AvatarImage 
              src={data.user.image}
            />
          </Avatar>
        ):(
            <GeneratedAvatar 
              seed={data.user.name}
              variant="initials"
              className="size-9 mr-3"
            />
        )}
      </DropdownMenuTrigger>
    </DropdownMenu>
  )
}
