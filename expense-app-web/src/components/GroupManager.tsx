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
    <div className="bg-zinc-900 border border-zinc-800 rounded-4xl p-5 md:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-violet-500" size={24} />
          <h3 className="text-xl font-bold text-white tracking-tight">Shared Groups</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 text-sm font-medium border border-zinc-700"
          >
            <LogIn size={14} /> Join
          </button>
          <button
            onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
            className="bg-violet-500 hover:bg-violet-400 text-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 text-sm font-medium"
          >
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 bg-black p-4 rounded-2xl border border-zinc-800 space-y-3">
          <p className="text-xs font-semibold uppercase text-zinc-500">Create a new group</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name (e.g. Pareja, Viaje Barilo)"
              className="flex-1 min-w-[200px] bg-zinc-900 rounded-xl border-none text-white px-4 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-violet-500 hover:bg-violet-400 disabled:bg-violet-500/50 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-1 font-medium text-sm"
            >
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Join Form */}
      {showJoin && (
        <form onSubmit={handleJoin} className="mb-6 bg-black p-4 rounded-2xl border border-zinc-800 space-y-3">
          <p className="text-xs font-semibold uppercase text-zinc-500">Join with invite code</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="w-32 bg-zinc-900 rounded-xl border-none text-white px-4 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm placeholder:text-zinc-500 uppercase tracking-widest font-mono text-center"
            />
            <button
              type="submit"
              disabled={joinMutation.isPending}
              className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-700/50 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-1 font-medium text-sm"
            >
              {joinMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Join'}
            </button>
          </div>
          {joinMutation.isError && (
            <p className="text-red-400 text-xs mt-1">Invalid code or already a member.</p>
          )}
        </form>
      )}

      {/* Groups List */}
      {isLoading ? (
        <div className="flex justify-center py-6 text-zinc-500"><Loader2 className="animate-spin" /></div>
      ) : groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map(group => (
            <div key={group.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 group/card">
              <div className="flex justify-between items-start mb-3">
                <div>
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
                      className="bg-zinc-900 text-white font-bold px-2 py-0.5 rounded-lg border border-violet-500 focus:outline-none text-sm w-full"
                    />
                  ) : (
                    <h4
                      className="text-white font-bold flex items-center gap-1.5 cursor-pointer group/name hover:text-violet-300 transition-colors"
                      onClick={() => { setEditingGroupId(group.id); setEditName(group.name); }}
                    >
                      {group.name}
                      <Pencil size={12} className="opacity-0 group-hover/name:opacity-100 text-zinc-500 transition-opacity" />
                    </h4>
                  )}
                  <p className="text-zinc-500 text-xs mt-0.5">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {group.invite_code && (
                    <button
                      onClick={() => copyCode(group.invite_code!, group.id)}
                      className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border border-zinc-800"
                      title="Copy invite code"
                    >
                      {copiedGroupId === group.id ? (
                        <><Check size={12} className="text-emerald-400" /> Copied!</>
                      ) : (
                        <><Copy size={12} /> {group.invite_code}</>
                      )}
                    </button>
                  )}
                  {group.invite_code && (
                    <button
                      onClick={() => setGroupToDelete(group.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover/card:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.members.map(member => (
                  <span
                    key={member.user_id}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20"
                  >
                    {member.nickname}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-600 italic text-center py-4">No shared groups yet. Create one or join with an invite code.</p>
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
        title="Delete Group"
        message="Are you sure you want to delete this group? All members will be removed. Existing shared transactions will keep their split data."
      />
    </div>
  );
}
