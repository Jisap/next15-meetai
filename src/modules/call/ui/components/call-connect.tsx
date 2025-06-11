import { user } from '../../../../db/schema';


interface Props {
  meetingId: string;
  meetingName: string;
  userId: string;
  userName: string;
  userImage: string;
}

export const CallConnect = ({ meetingId, meetingName, userId, userName, userImage }: Props) => {
  return (
    <div>
      Call Connect
    </div>
  )
}