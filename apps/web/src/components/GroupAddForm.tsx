'use client';

import { useState } from 'react';
import { useCreateGroup, useJoinGroup } from '@/hooks/usePreferences';
import { PrimaryButton, SegmentedControl, fieldClass } from './settings/ui';

/** Create a group or join one with an invite code. */
export function GroupAddForm({
  initialJoinCode = '',
  onAdded,
}: {
  /** From an invite link; opens the form on "Unirme" with the code filled. */
  initialJoinCode?: string;
  onAdded?: (groupId: number) => void;
}) {
  const createMutation = useCreateGroup();
  const joinMutation = useJoinGroup();
  const [mode, setMode] = useState<'create' | 'join'>(
    initialJoinCode ? 'join' : 'create',
  );
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState(initialJoinCode.toUpperCase());

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    createMutation.mutate(
      { name: groupName.trim(), nickname: '' },
      {
        onSuccess: (data) => {
          setGroupName('');
          onAdded?.(data.group.id);
        },
      },
    );
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    joinMutation.mutate(
      { invite_code: joinCode.trim(), nickname: '' },
      {
        onSuccess: (data) => {
          setJoinCode('');
          onAdded?.(data.group.id);
        },
      },
    );
  };

  return (
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
  );
}
