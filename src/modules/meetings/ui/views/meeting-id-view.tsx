import React from 'react'

interface Props {
  meetingId: string
}


export const MeetingIdView = ({ meetingId }: Props) => {
  return (
    <>
      <div className='flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4'>
        MeetingIdView
      </div>
    </>
  )
}

