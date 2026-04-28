import { DndContext, type DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { PageHeader } from '../components/data-table/Toolbar'
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
        <div className="grid min-w-0 grid-cols-1 gap-4 pb-2 md:grid-cols-2 xl:flex xl:items-start xl:overflow-x-auto xl:pb-4">
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
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {deal.probability}%
                        </span>
                      </div>
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
    <Card
      ref={setNodeRef}
      className={`min-h-40 min-w-0 p-3 transition-shadow xl:min-h-80 xl:w-80 xl:shrink-0 ${isOver ? 'ring-2 ring-emerald-500' : ''
        }`}
    >
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
      className={`min-w-0 touch-pan-y rounded-md border border-slate-200 bg-white p-3 shadow-sm ${isDragging ? 'z-10 opacity-70 ring-2 ring-sky-500' : ''
        }`}
    >
      {children}
    </article>
  )
}
