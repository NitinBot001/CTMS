import React from 'react'
import { DateTimeDisplay } from './DateDisplay'

export interface RecordMetaProps {
  id?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  className?: string
}

export const RecordMeta: React.FC<RecordMetaProps> = ({
  id,
  createdAt,
  updatedAt,
  createdBy,
  className,
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#726B5C] border-t border-[#E4DED3] pt-3 mt-4 ${className || ''}`}>
      {id && (
        <div>
          <span className="font-semibold text-[#5A5347]">ID: </span>
          <span className="font-mono text-[#1C1A17]">{id}</span>
        </div>
      )}
      {createdAt && (
        <div>
          <span className="font-semibold text-[#5A5347]">Created: </span>
          <DateTimeDisplay value={createdAt} />
        </div>
      )}
      {updatedAt && (
        <div>
          <span className="font-semibold text-[#5A5347]">Last Updated: </span>
          <DateTimeDisplay value={updatedAt} />
        </div>
      )}
      {createdBy && (
        <div>
          <span className="font-semibold text-[#5A5347]">Actor: </span>
          <span className="text-[#1C1A17]">{createdBy}</span>
        </div>
      )}
    </div>
  )
}
