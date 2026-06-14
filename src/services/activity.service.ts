import { newId, timestamp, useAppStore } from '../store/app-store'
import type { ActivityLog } from '../types/domain'
import { localMutation } from './local-mutation'

export function useRecentActivity(limit = 8) {
  const logs = useAppStore((state) => state.activityLogs)
  return { data: [...logs].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit), isLoading: false }
}

export function useActivityLogs(entityType: string, entityId: string) {
  const logs = useAppStore((state) => state.activityLogs)
  return { data: logs.filter((item) => item.entity_type === entityType && item.entity_id === entityId), isLoading: false }
}

export function useLogActivity() {
  const logs = useAppStore((state) => state.activityLogs)
  return localMutation((input: Partial<ActivityLog> & { entityType?: string; entityId?: string; action: string }) => {
    const log: ActivityLog = {
      id: newId('activity'),
      actor_id: input.actor_id ?? null,
      entity_type: input.entity_type ?? input.entityType ?? 'unknown',
      entity_id: input.entity_id ?? input.entityId ?? '',
      action: input.action,
      metadata: input.metadata ?? {},
      created_at: input.created_at ?? timestamp(),
    }
    useAppStore.setState({ activityLogs: [log, ...logs] })
    return log
  })
}
