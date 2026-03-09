'use client';

import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { LogOut, User, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CategoryManager } from '@/components/CategoryManager';
import { TagManager } from '@/components/TagManager';
import { AccountManager } from '@/components/AccountManager';

export default function SettingsPage() {
  const { session } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="px-8 py-8 md:max-w-4xl max-w-full mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your profile, integrations, and preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700">
                <User size={32} />
              </div>
              <div>
                 <h3 className="text-xl font-bold text-white mb-1">Account Info</h3>
                 <p className="text-zinc-400 text-sm">Signed in with Supabase JWT Strategy</p>
              </div>
           </div>

           <div className="bg-black border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
              <div>
                 <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-1">Email Address</p>
                 <p className="text-white">{session?.user?.email || 'Unknown User'}</p>
              </div>
              <div className="bg-zinc-900 px-3 py-1 rounded-full text-xs text-zinc-300 font-medium">Verified</div>
           </div>
        </div>

        <AccountManager />
        <CategoryManager />
        <TagManager />

        {/* Sync Integrations Placeholder */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="text-emerald-500" size={24} />
            <h3 className="text-lg font-bold text-white">Apple Shortcuts API</h3>
          </div>
          <p className="text-zinc-400 text-sm mb-4">
            Connect your custom iOS shortcuts seamlessly to the Cloudflare Backend using your distinct API Key.
          </p>
          <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-colors border border-zinc-700">
             Manage Access Key
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex justify-between items-center">
             <div>
                <h3 className="text-lg font-bold text-white mb-1 tracking-tight">End Session</h3>
                <p className="text-zinc-500 text-sm">Sign out of Seva Web on this browser.</p>
             </div>
             <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-400 text-white font-semibold py-2 px-6 rounded-xl text-sm transition-colors flex items-center gap-2"
             >
                <LogOut size={16} /> Sign out
             </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
