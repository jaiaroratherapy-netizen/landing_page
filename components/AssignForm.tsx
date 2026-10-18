import { ActionForm, Submit } from './ActionForm'
import { assignClient } from '@/app/admin/actions'
import type { Trainee } from '@/lib/types'

export function AssignForm({ clientId, current, trainees, load }: { clientId: string; current: string | null; trainees: Trainee[]; load: Map<string, number> }) {
  return (
    <ActionForm action={assignClient} className="row" >
      <input type="hidden" name="client_id" value={clientId} />
      <select name="trainee_id" defaultValue={current ?? ''} aria-label="Therapist" style={{ width: 'auto', minWidth: 180 }}>
        <option value="">Unassigned</option>
        {trainees.filter((t) => t.status !== 'completed').map((t) => (
          <option key={t.id} value={t.id}>{t.full_name} ({load.get(t.id) ?? 0}/{t.max_clients}){t.status === 'invited' ? ' · not onboarded' : ''}</option>
        ))}
      </select>
      <Submit className="btn small">Assign</Submit>
    </ActionForm>
  )
}
