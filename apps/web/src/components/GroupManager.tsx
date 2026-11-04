'use client';

import { useState } from 'react';
import {
  useGroups,
  useCreateGroup,
  useJoinGroup,
  useDeleteGroup,
  useUpdateGroup,
} from '@/hooks/usePreferences';
import { Trash2, Copy, Check, Pencil } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  IconButton,
  PrimaryButton,
  SegmentedControl,
  SettingsList,
  SettingsListEmpty,
  fieldClass,
  secondaryButtonClass,
} from './settings/ui';

export function GroupManager() {
  const { data, isLoading } = useGroups();
  const createMutation = useCreateGroup();
  const joinMutation = useJoinGroup();
  const deleteMutation = useDeleteGroup();
  const updateMutation = useUpdateGroup();

  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedGroupId, setCopiedGroupId] = useState<number | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const groups = data?.groups || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    createMutation.mutate(
      { name: groupName.trim(), nickname: '' },
      { onSuccess: () => setGroupName('') },
    );
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    joinMutation.mutate(
      { invite_code: joinCode.trim(), nickname: '' },
      { onSuccess: () => setJoinCode('') },
    );
  };

  const saveName = (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateMutation.mutate(
      { id, name: editName.trim() },
      { onSuccess: () => setEditingId(null) },
    );
  };

  const copyCode = (code: string, groupId: number) => {
    navigator.clipboard.writeText(code);
    setCopiedGroupId(groupId);
    setTimeout(() => setCopiedGroupId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner color="muted" />
        </div>
      ) : groups.length > 0 ? (
        <SettingsList label="Tus grupos">
          {groups.map((group) => (
            <li key={group.id} className="px-4 py-3.5">
              {editingId === group.id ? (
                <form
                  onSubmit={(e) => saveName(e, group.id)}
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  <input
                    autoFocus
                    aria-label="Nombre del grupo"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={fieldClass}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className={secondaryButtonClass}
                    >
                      Cancelar
                    </button>
                    <PrimaryButton
                      type="submit"
                      loading={updateMutation.isPending}
                      disabled={!editName.trim()}
                    >
                      Guardar
                    </PrimaryButton>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-primary truncate text-sm font-semibold">
                      {group.name}
                    </p>
                    <p className="text-muted mt-0.5 truncate text-xs">
                      {group.members.map((m) => m.nickname).join(', ')}
                    </p>
                  </div>
                  <div className="-mr-2 flex shrink-0 items-center">
                    {group.invite_code && (
                      <button
                        type="button"
                        onClick={() => copyCode(group.invite_code!, group.id)}
                        aria-label={`Copiar código de invitación ${group.invite_code}`}
                        className="text-secondary hover:text-primary hover:bg-inset focus-ring flex h-9 items-center gap-1.5 rounded-lg px-2.5 font-mono text-xs transition-colors"
                      >
                        {copiedGroupId === group.id ? (
                          <>
                            <Check size={14} className="text-accent" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            {group.invite_code}
                          </>
                        )}
                      </button>
                    )}
                    <IconButton
                      label={`Renombrar ${group.name}`}
                      onClick={() => {
                        setEditingId(group.id);
                        setEditName(group.name);
                      }}
                    >
                      <Pencil size={15} />
                    </IconButton>
                    {group.invite_code && (
                      <IconButton
                        label={`Eliminar ${group.name}`}
                        tone="danger"
                        onClick={() => setGroupToDelete(group.id)}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </SettingsList>
      ) : (
        <SettingsListEmpty>
          Aún no tienes grupos. Crea uno para dividir gastos o únete con un
          código de invitación.
        </SettingsListEmpty>
      )}

      <div>
        <SegmentedControl
          label="Agregar grupo"
          value={mode}
          options={[
            { value: 'create', label: 'Crear grupo' },
            { value: 'join', label: 'Unirme con código' },
          ]}
          onChange={setMode}
          className="mb-3 sm:max-w-sm"
        />
        {mode === 'create' ? (
          <form
            onSubmit={handleCreate}
            aria-label="Crear grupo"
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              aria-label="Nombre del grupo"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ej. Pareja, Viaje a Chiloé"
              className={fieldClass}
            />
            <PrimaryButton
              type="submit"
              loading={createMutation.isPending}
              disabled={!groupName.trim()}
            >
              Crear
            </PrimaryButton>
          </form>
        ) : (
          <form onSubmit={handleJoin} aria-label="Unirme a un grupo">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                aria-label="Código de invitación"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Código de 6 caracteres"
                maxLength={6}
                className={`${fieldClass} font-mono tracking-widest uppercase sm:max-w-56`}
              />
              <PrimaryButton
                type="submit"
                loading={joinMutation.isPending}
                disabled={!joinCode.trim()}
              >
                Unirme
              </PrimaryButton>
            </div>
            {joinMutation.isError && (
              <p role="alert" className="text-expense mt-2 text-sm">
                El código no es válido o ya eres parte de ese grupo.
              </p>
            )}
          </form>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={groupToDelete !== null}
        onClose={() => setGroupToDelete(null)}
        onConfirm={() => {
          if (groupToDelete !== null) deleteMutation.mutate(groupToDelete);
        }}
        title="Eliminar grupo"
        message="Todos los miembros saldrán del grupo. Los gastos compartidos que ya existen mantienen su división."
      />
    </div>
  );
}
