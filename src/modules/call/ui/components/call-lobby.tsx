
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

const DisabledVideoPreview = () => {                     // Componente que se renderiza cuando no se tienen permisos de cámara y micrófono
  const { data } = authClient.useSession();

  return (
    <DefaultVideoPlaceholder
      participant={
        {
          name: data?.user.name ?? "",
          image:
            data?.user.image ?? generateAvatarUri({
              seed: data?.user.name ?? "",
              variant: "initials"
            })
        } as StreamVideoParticipant
      }
    />
  )
}

const AllowBrowserPermissions = () => {                  // Componente que se renderiza cuando se tienen permisos de cámara y micrófono
  return (
    <p className="text-sm">
      Please grant your browser a permission to access your camera and Microphone
    </p>
  )
}

export const CallLobby = ({ onJoin }: Props) => {
  
  const { useCameraState, useMicrophoneState } = useCallStateHooks();      // Hooks de Stream Video para obtener el estado de la cámara y el micrófono
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState(); // Obtiene el estado de si el navegador tiene permiso para acceder al micrófono
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();  // Obtiene el estado de si el navegador tiene permiso para acceder a la cámara

  const hasBrowserMediaPermissions = hasMicPermission && hasCameraPermission; // Es true si se tienen los dos permisos

  return (
    <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent to-sidebar">
      <div className="py-4 px-8 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
          <div className="flex flex-col gap-y-2 text-center text-black">
            <h6 className="text-lg font-medium">Ready to join ?</h6>
            <p className="text-sm">Set up your call before joining</p>
          </div>

          <VideoPreview 
            DisabledVideoPreview={          // Le dice que componente debe renderizar en caso de no pueda mostrar el video
              hasBrowserMediaPermissions    // Si es true -> ? sino :
                ? DisabledVideoPreview      // Si hay permisos pero el usuario desactivo su camara -> DisabledVideoPreview
                : AllowBrowserPermissions   // Sino tiene permisos de cámara y micrófono -> AllowBrowserPermissions
            }
          />

          <div className="flex gap-x-2">
            <ToggleVideoPreviewButton />
            <ToggleAudioPreviewButton />
          </div>

          <div className="flex gap-x-2 justify-between w-full">
            <Button asChild variant="ghost">
              <Link href="/meetings">
                Cancel
              </Link>
            </Button>
            <Button onClick={onJoin}>
              <LogInIcon />
              Join Call
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
