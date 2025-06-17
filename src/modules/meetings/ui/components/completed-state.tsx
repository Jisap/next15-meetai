import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { MeetingGetOne } from "../../types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpenTextIcon,
  SparklesIcon,
  FileTextIcon,
  FileVideoIcon,
  ClockFadingIcon,
} from "lucide-react"





interface Props {
  data: MeetingGetOne
}

const CompletedState = ({ data }: Props) => {
  return (
    <div className="flex flex-col gap-y-4">
      <Tabs defaultValue="summary">
        <div className="bg-white rounded-lg border px-3">
          <ScrollArea>
            <TabsList className="p-0 bg-background justify-start rounded-none h-13">
              <TabsTrigger 
                value="summary"
                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"  
              >
                <BookOpenTextIcon />
                Summary
              </TabsTrigger>
              <TabsTrigger 
                value="transcript"
                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"  
              >
                <FileTextIcon />
                Transcript
              </TabsTrigger>
              <TabsTrigger 
                value="recording"
                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"  
              >
                <FileVideoIcon />
                Recording
              </TabsTrigger>
              <TabsTrigger 
                value="chat"
                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"  
              >
                <SparklesIcon />
                Ask AI
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  )
}

export default CompletedState