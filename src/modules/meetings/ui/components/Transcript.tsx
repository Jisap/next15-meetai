import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { generateAvatarUri } from "@/lib/avatar"
import { useTRPC } from "@/trpc/client"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { SearchIcon } from "lucide-react"
import { useState } from "react"
import Highlighter from "react-highlight-words"
import { trpc } from '../../../../trpc/server';




interface Props {
  meetingId: string
}

const Transcript = ({ meetingId }: Props) => {

  const trpc = useTRPC()
  const queryBaseOptions = trpc.meetings.getTranscript.queryOptions({ id: meetingId })
  const { data } = useQuery({
    ...queryBaseOptions,
    retry: 3,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData] = (data ?? []).filter((item) =>
    item.text.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
      <p className="text-sm font-medium">
        Transcript
      </p>
      
      <div className="relative">
        <Input 
          placeholder="Search transcript"
          className="pl-7 h-9 w-[240px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /> 
      </div>
    </div>
  )
}

export default Transcript