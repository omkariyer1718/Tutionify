'use client'

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { BatchForm } from './batch-form'
import { PersonalSlotForm } from './personal-slot-form'
import { deletePersonalSlot } from '@/lib/actions/personal-slots'
import type { BatchWithTextbook, Textbook, PersonalSlotWithSchedules } from '@/types/database'

interface TimetableClientProps {
  batches: BatchWithTextbook[]
  textbooks: Textbook[]
  personalSlots?: PersonalSlotWithSchedules[]
}

export function TimetableClient({ batches, textbooks, personalSlots = [] }: TimetableClientProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [slotFormOpen, setSlotFormOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<BatchWithTextbook | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<PersonalSlotWithSchedules | null>(null)
  const [initialDate, setInitialDate] = useState<{ weekday: number, start_time: string, end_time: string } | null>(null)

  const batchEvents = batches.flatMap(batch => {
    if (!batch.schedules) return []
    return batch.schedules.map(schedule => ({
      id: `batch-${batch.id}-${schedule.id}`,
      title: `${batch.display_name} (${batch.student_count || 0} students)`,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      daysOfWeek: [schedule.weekday],
      backgroundColor: batch.textbook?.color_code || '#6366f1',
      borderColor: batch.textbook?.color_code || '#6366f1',
      extendedProps: {
        type: 'batch',
        batch
      }
    }))
  })

  const slotEvents = personalSlots.flatMap(slot => {
    if (!slot.schedules) return []
    return slot.schedules.map(schedule => ({
      id: `slot-${slot.id}-${schedule.id}`,
      title: slot.title,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      daysOfWeek: [schedule.weekday],
      backgroundColor: slot.color_code || '#6366f1',
      borderColor: slot.color_code || '#6366f1',
      extendedProps: {
        type: 'personal_slot',
        slot
      }
    }))
  })

  const events = [...batchEvents, ...slotEvents]

  const handleEventClick = async (info: any) => {
    const props = info.event.extendedProps
    if (props.type === 'batch') {
      setSelectedBatch(props.batch)
      setInitialDate(null)
      setFormOpen(true)
    } else if (props.type === 'personal_slot') {
      setSelectedSlot(props.slot)
      setInitialDate(null)
      setSlotFormOpen(true)
    }
  }

  const handleDateSelect = (info: any) => {
    const start = new Date(info.start)
    const end = new Date(info.end)
    const weekday = start.getDay()
    const start_time = start.toTimeString().split(' ')[0]
    const end_time = end.toTimeString().split(' ')[0]

    setSelectedBatch(null)
    setInitialDate({ weekday, start_time, end_time })
    setFormOpen(true)
    info.view.calendar.unselect()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={() => {
            setSelectedSlot(null)
            setInitialDate(null)
            setSlotFormOpen(true)
          }}
          className="bg-white border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50"
        >
          Add Slot
        </button>
        <button
          onClick={() => {
            setSelectedBatch(null)
            setInitialDate(null)
            setFormOpen(true)
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Add Batch
        </button>
      </div>

      <div className="timetable-container">
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          height="auto"
          events={events}
          eventClick={handleEventClick}
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
        />
      </div>

      {formOpen && (
        <BatchForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          batch={selectedBatch}
          initialDate={initialDate}
          textbooks={textbooks}
        />
      )}

      {slotFormOpen && (
        <PersonalSlotForm
          open={slotFormOpen}
          onClose={() => setSlotFormOpen(false)}
          slot={selectedSlot}
          initialDate={initialDate}
        />
      )}
    </div>
  )
}
