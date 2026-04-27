import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Card } from '../components/ui/card'
import { DealFormDialog } from '../features/deals/DealFormDialog'
import { money } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

export function PipelineRoute() {
  const { pipelineStages, deals, customers, moveDeal } = useDemoStore()

  function onDragEnd(event: DragEndEvent) {
    if (event.over?.id && event.active.id) {
      moveDeal(String(event.active.id), String(event.over.id))
    }
  }

  return (
    <div>
      <PageHeader title="Pipeline Kanban" description="Arrastra oportunidades entre fases o usa los botones de fase en cada tarjeta." action={<DealFormDialog />} />
      <DndContext onDragEnd={onDragEnd}>
        <div className="grid gap-4 overflow-x-auto pb-2 xl:grid-cols-4 2xl:grid-cols-8">
          {pipelineStages.map((stage) => {
            const stageDeals = deals.filter((deal) => deal.stage_id === stage.id)
            return (
              <PipelineColumn key={stage.id} id={stage.id}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-950">{stage.name}</h3>
                    <p className="text-xs text-slate-500">{stageDeals.length} oportunidades</p>
                  </div>
                  <span className="h-3 w-3 rounded-full" style={{ background: stage.color }} />
                </div>
                <div className="grid gap-3">
                  {stageDeals.map((deal) => (
                    <DealCard key={deal.id} id={deal.id}>
                      <p className="font-medium text-slate-950">{deal.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{customers.find((customer) => customer.id === deal.customer_id)?.name}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{money.format(deal.value_eur)}</span>
                        <StatusBadge value={`${deal.probability}%`} />
                      </div>
                      <select
                        className="mt-3 min-h-10 w-full rounded-md border border-slate-200 px-2 text-sm"
                        value={deal.stage_id}
                        onChange={(event) => moveDeal(deal.id, event.target.value)}
                      >
                        {pipelineStages.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </DealCard>
                  ))}
                </div>
              </PipelineColumn>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}

function PipelineColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <Card ref={setNodeRef} className={`min-h-80 min-w-72 p-3 ${isOver ? 'ring-2 ring-emerald-500' : ''}`}>
      {children}
    </Card>
  )
}

function DealCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`touch-none rounded-md border border-slate-200 bg-white p-3 shadow-sm ${isDragging ? 'z-10 opacity-70 ring-2 ring-sky-500' : ''}`}
    >
      {children}
    </article>
  )
}
