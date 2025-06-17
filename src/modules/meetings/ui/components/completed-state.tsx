import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { MeetingGetOne } from "../../types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpenText, BookOpenTextIcon } from "lucide-react"





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
              <TabsTrigger value="summary">
                <BookOpenTextIcon />
                Summary
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