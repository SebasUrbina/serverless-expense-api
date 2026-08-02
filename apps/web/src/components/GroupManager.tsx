'use client';

import { useState } from 'react';
import { useGroups, useCreateGroup, useJoinGroup, useDeleteGroup, useUpdateGroup } from '@/hooks/usePreferences';
import { Plus, Trash2, Copy, Check, LogIn, Pencil } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
            showJoin
              ? 'bg-card border-border text-primary shadow-sm'
              : 'border-border text-secondary hover:text-primary'
          }`}
        >
          <LogIn size={14} /> Unirme
        </button>
        <button
          onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors bg-accent hover:bg-emerald-600 text-white shadow-sm"
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
            className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-card border border-border text-primary"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-accent hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            {createMutation.isPending ? <LoadingSpinner size="sm" color="white" /> : 'Crear'}
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
            className="w-32 rounded-xl px-4 py-2.5 text-sm uppercase tracking-widest font-mono text-center focus:outline-none focus:ring-2 focus:ring-accent/30 bg-card border border-border text-primary"
          />
          <button
            type="submit"
            disabled={joinMutation.isPending}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 bg-card border border-border text-primary hover:bg-card-hover"
          >
            {joinMutation.isPending ? <LoadingSpinner size="sm" color="accent" /> : 'Unirme'}
          </button>
          {joinMutation.isError && (
            <p className="text-red-400 text-xs self-center">Código inválido o ya sos miembro.</p>
          )}
        </form>
      )}

      {/* Groups List */}
      {isLoading ? (
        <div className="flex justify-center py-6"><LoadingSpinner color="muted" /></div>
      ) : groups.length > 0 ? (
        <div className="space-y-2">
          {groups.map(group => (
            <div
              key={group.id}
              className="rounded-xl p-4 group/card transition-colors bg-card border border-border hover:border-border-subtle"
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
                      className="font-bold px-2 py-0.5 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-accent/30 bg-inset border border-border text-primary"
                    />
                  ) : (
                    <h4
                      className="font-bold text-sm flex items-center gap-1.5 cursor-pointer group/name transition-colors text-primary"
                      onClick={() => { setEditingGroupId(group.id); setEditName(group.name); }}
                    >
                      {group.name}
                      <Pencil size={11} className="opacity-0 group-hover/name:opacity-100 transition-opacity text-muted" />
                    </h4>
                  )}
                  <p className="text-[11px] mt-0.5 text-muted">
                    {group.members.length} miembro{group.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {group.invite_code && (
                    <button
                      onClick={() => copyCode(group.invite_code!, group.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors bg-inset border border-border text-secondary hover:text-primary"
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
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  >
                    {member.nickname}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-center py-4 text-muted">
          Aún no tienes grupos. Crea uno o únete con un código de invitación.
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
