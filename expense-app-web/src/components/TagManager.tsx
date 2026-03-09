'use client';

import { useState } from 'react';
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/usePreferences';
import { Plus, Trash2, Loader2, Hash } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function TagManager() {
  const { data, isLoading } = useTags();
  const createMutation = useCreateTag();
  const deleteMutation = useDeleteTag();

  const [name, setName] = useState('');
  const [tagToDelete, setTagToDelete] = useState<number | null>(null);

  const tags = data?.tags || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate({ name: name.trim() }, {
      onSuccess: () => setName('')
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Hash className="text-violet-500" size={24} />
        <h3 className="text-xl font-bold text-white">Tags</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8 items-center bg-black p-2 rounded-2xl border border-zinc-800">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New Tag Name (e.g. vacation)..."
          className="flex-1 bg-transparent border-none text-white px-4 py-2 focus:outline-none focus:ring-0 text-sm placeholder:text-zinc-600"
        />
        <button
          type="submit"
          disabled={!name.trim() || createMutation.isPending}
          className="bg-violet-500 hover:bg-violet-400 disabled:bg-violet-500/50 text-white p-2 rounded-xl transition-colors flex items-center justify-center"
        >
          {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-6 text-zinc-500"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="flex flex-wrap gap-3">
            {tags.map(tag => (
                <div key={tag.id} className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800 group">
                    <Hash size={14} className="text-zinc-500" />
                    <span className="text-zinc-300 font-medium text-sm pr-2">{tag.name}</span>
                    <button 
                        onClick={() => setTagToDelete(tag.id)}
                        disabled={deleteMutation.isPending}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            {tags.length === 0 && <p className="text-sm text-zinc-600 italic w-full">No tags created yet. Start organizing your expenses!</p>}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={tagToDelete !== null}
        onClose={() => setTagToDelete(null)}
        onConfirm={() => {
          if (tagToDelete !== null) deleteMutation.mutate(tagToDelete);
        }}
        title="Delete Tag"
        message="¿Estás seguro? Borrar este tag eliminará permanentemente su asociación en todas las transacciones."
      />
    </div>
  );
}
