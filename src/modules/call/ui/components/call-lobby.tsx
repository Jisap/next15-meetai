
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { generateAvatarUri } from "@/lib/avatar";
import {
  DefaultVideoPlaceholder,
  StreamVideoParticipant,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCallStateHooks,
  VideoPreview,
} from "@stream-io/video-react-sdk"
import { LogInIcon } from "lucide-react"
import Link from "next/link";
import "@stream-io/video-react-sdk/dist/css/styles.css"

interface Props {
  onJoin: () => void;
}

export const CallLobby = ({ onJoin }: Props) => {
  
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();

  const hasBrowserMediaPermissions = hasMicPermission && hasCameraPermission;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent to-sidebar">
      <div className="py-4 px-8 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
          <div className="flex flex-col gap-y-2 text-center text-black">
            <h6 className="text-lg font-medium">Ready to join ?</h6>
            <p className="text-sm">Set up your call before joining</p>
          </div>
        </div>
      </div>
    </div>
  )
  
  return (
    <div>CallLobby</div>
  )
}
