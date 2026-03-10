'use client';

import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { LogOut, User, Wallet, Users, Settings2, Code2, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CategoryManager } from '@/components/CategoryManager';
import { TagManager } from '@/components/TagManager';
import { AccountManager } from '@/components/AccountManager';
import { GroupManager } from '@/components/GroupManager';
import { ApiKeyManager } from '@/components/ApiKeyManager';

type TabId = 'general' | 'accounts' | 'groups' | 'preferences' | 'integration';

export default function SettingsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: UserCircle },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'preferences', label: 'Preferences', icon: Settings2 },
    { id: 'integration', label: 'Integration', icon: Code2 },
  ] as const;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="mb-2 mt-2 px-2">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
        <p className="text-zinc-400 text-sm">Manage your profile, integrations, and preferences.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all font-medium text-sm
                ${isActive 
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/50' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <Icon size={16} className={isActive ? 'text-blue-400' : 'text-zinc-500'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-4xl p-5 md:p-6 shadow-xl">
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

            {/* Danger Zone */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-4xl p-5 md:p-6 shadow-xl mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                 <div>
                    <h3 className="text-lg font-bold text-white mb-1 tracking-tight">End Session</h3>
                    <p className="text-zinc-500 text-sm">Sign out of Seva Web on this browser.</p>
                 </div>
                 <button 
                    onClick={handleLogout}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 sm:w-auto w-full"
                 >
                    <LogOut size={16} /> Sign out
                 </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && <AccountManager />}
        
        {activeTab === 'groups' && <GroupManager />}
        
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <CategoryManager />
            <TagManager />
          </div>
        )}
        
        {activeTab === 'integration' && <ApiKeyManager />}
      </div>
    </div>
  );
}
