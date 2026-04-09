'use client';

import { useState } from 'react';
import { Key, Eye, EyeOff, Copy, RefreshCw, Check, Zap } from 'lucide-react';
import { useApiKey, useGenerateApiKey } from '@/hooks/usePreferences';

export function ApiKeyManager() {
  const { data, isLoading } = useApiKey();
  const generateMutation = useGenerateApiKey();
  
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const apiKey = data?.key || '';

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    generateMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmRegenerate(false);
      }
    });
  };

  // Replace this URL with the actual iCloud link if the user has one,
  // or use a placeholder they can update.
  const shortcutUrl = "https://www.icloud.com/shortcuts/placeholder"; // The user didn't provide a specific link, so we will use a placeholder or generic link. Wait, there was a previous conversation about shortening API keys.

  return (
    <div className="bg-inset border border-border rounded-4xl p-5 md:p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Key className="text-emerald-500" size={24} />
        <h3 className="text-xl font-bold text-primary tracking-tight">Apple Shortcuts API</h3>
      </div>
      
      <p className="text-muted text-sm mb-6">
        Add transactions on the go using your custom iOS shortcuts. Connect them seamlessly to your accounts using your distinct API Key. Keep this key secret.
      </p>

      <div className="bg-black border border-border rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold uppercase text-secondary mb-2">Your Secret API Key</p>
        
        {isLoading ? (
          <div className="h-10 bg-inset animate-pulse rounded-xl"></div>
        ) : apiKey ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center bg-inset rounded-xl px-4 py-2.5 min-h-[44px] overflow-hidden">
              <span className="font-mono text-emerald-400 truncate text-sm">
                {showKey ? apiKey : '••••••••••••••••••••••••'}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowKey(!showKey)}
                className="flex items-center justify-center w-11 h-11 bg-card-hover hover:bg-border text-muted hover:text-primary rounded-xl transition-colors"
                title={showKey ? "Hide Key" : "Reveal Key"}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center w-11 h-11 bg-card-hover hover:bg-border text-muted hover:text-primary rounded-xl transition-colors"
                title="Copy Key"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-secondary italic py-2">No API Key generated yet.</div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {!confirmRegenerate ? (
          <button 
            onClick={() => setConfirmRegenerate(true)}
            disabled={generateMutation.isPending || isLoading}
            className="flex-1 bg-card-hover hover:bg-border text-primary font-medium py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-border-subtle"
          >
            <RefreshCw size={16} className={generateMutation.isPending ? "animate-spin" : ""} />
            {apiKey ? 'Regenerate Key' : 'Generate Key'}
          </button>
        ) : (
          <div className="flex-1 flex gap-2">
            <button 
              onClick={handleRegenerate}
              className="flex-1 bg-red-500 hover:bg-red-400 text-white font-medium py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center"
            >
              Confirm
            </button>
            <button 
              onClick={() => setConfirmRegenerate(false)}
              className="flex-1 bg-card-hover hover:bg-border text-primary font-medium py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        )}

        <a 
          href="https://www.icloud.com/shortcuts/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Zap size={16} className="fill-emerald-100" />
          Add iOS Shortcut
        </a>
      </div>
    </div>
  );
}
