'use client';

import { useState } from 'react';
import { useGroups, useCreateGroup, useJoinGroup, useDeleteGroup, useUpdateGroup } from '@/hooks/usePreferences';
import { Users, Plus, Loader2, Trash2, Copy, Check, LogIn, Pencil } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function GroupManager() {
  const { data, isLoading } = useGroups();
  const createMutation = useCreateGroup();
  const joinMutation = useJoinGroup();
  const deleteMutation = useDeleteGroup();
  const updateMutation = useUpdateGroup();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedGroupId, setCopiedGroupId] = useState<number | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const groups = data?.groups || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    createMutation.mutate({ name: groupName.trim(), nickname: '' }, {
      onSuccess: () => {
        setGroupName('');
        setShowCreate(false);
      },
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    joinMutation.mutate({ invite_code: joinCode.trim(), nickname: '' }, {
      onSuccess: () => {
        setJoinCode('');
        setShowJoin(false);
      },
    });
  };

  const copyCode = (code: string, groupId: number) => {
    navigator.clipboard.writeText(code);
    setCopiedGroupId(groupId);
    setTimeout(() => setCopiedGroupId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: showJoin ? 'var(--bg-card)' : 'transparent',
            border: '1px solid var(--border)',
            color: showJoin ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: showJoin ? 'var(--shadow-card)' : 'none',
          }}
        >
          <LogIn size={14} /> Unirme
        </button>
        <button
          onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors bg-emerald-500 hover:bg-emerald-400 text-white"
        >
          <Plus size={14} /> Crear grupo
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            required
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Nombre del grupo (ej. Pareja, Viaje)"
            className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            {createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Crear'}
          </button>
        </form>
      )}

      {/* Join Form */}
      {showJoin && (
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            required
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Código de invitación"
            maxLength={6}
            className="w-32 rounded-xl px-4 py-2.5 text-sm uppercase tracking-widest font-mono text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            disabled={joinMutation.isPending}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {joinMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Unirme'}
          </button>
          {joinMutation.isError && (
            <p className="text-red-400 text-xs self-center">Código inválido o ya sos miembro.</p>
          )}
        </form>
      )}

      {/* Groups List */}
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
      ) : groups.length > 0 ? (
        <div className="space-y-2">
          {groups.map(group => (
            <div
              key={group.id}
              className="rounded-xl p-4 group/card transition-colors"
              style={{ background: 'var(--bg-card)' }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  {editingGroupId === group.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editName.trim()) {
                          updateMutation.mutate({ id: group.id, name: editName.trim() });
                          setEditingGroupId(null);
                        }
                        if (e.key === 'Escape') setEditingGroupId(null);
                      }}
                      onBlur={() => {
                        if (editName.trim() && editName.trim() !== group.name) {
                          updateMutation.mutate({ id: group.id, name: editName.trim() });
                        }
                        setEditingGroupId(null);
                      }}
                      className="font-bold px-2 py-0.5 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      style={{
                        background: 'var(--bg-inset)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  ) : (
                    <h4
                      className="font-bold text-sm flex items-center gap-1.5 cursor-pointer group/name transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onClick={() => { setEditingGroupId(group.id); setEditName(group.name); }}
                    >
                      {group.name}
                      <Pencil size={11} className="opacity-0 group-hover/name:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                    </h4>
                  )}
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {group.members.length} miembro{group.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {group.invite_code && (
                    <button
                      onClick={() => copyCode(group.invite_code!, group.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors"
                      style={{
                        background: 'var(--bg-inset)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                      title="Copiar código de invitación"
                    >
                      {copiedGroupId === group.id ? (
                        <><Check size={11} className="text-emerald-400" /> Copiado</>
                      ) : (
                        <><Copy size={11} /> {group.invite_code}</>
                      )}
                    </button>
                  )}
                  {group.invite_code && (
                    <button
                      onClick={() => setGroupToDelete(group.id)}
                      className="p-1.5 rounded-lg transition-all opacity-0 group-hover/card:opacity-100 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.members.map(member => (
                  <span
                    key={member.user_id}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{
                      background: 'var(--emerald-soft)',
                      color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.2)',
                    }}
                  >
                    {member.nickname}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
          Sin grupos aún. Creá uno o unite con un código de invitación.
        </p>
      )}

      <ConfirmDeleteModal
        isOpen={groupToDelete !== null}
        onClose={() => setGroupToDelete(null)}
        onConfirm={() => {
          if (groupToDelete !== null) {
            deleteMutation.mutate(groupToDelete);
            setGroupToDelete(null);
          }
        }}
        title="Eliminar grupo"
        message="¿Estás seguro? Todos los miembros serán removidos. Las transacciones compartidas existentes mantendrán sus datos de división."
      />
    </div>
  );
}
