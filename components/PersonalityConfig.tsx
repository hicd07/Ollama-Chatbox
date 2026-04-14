import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, Save, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PersonalityProfile } from '@/src/types';

interface PersonalityConfigProps {
  profiles: PersonalityProfile[];
  selectedProfileId: string;
  onSelect: (id: string) => void;
  onUpdate: (profiles: PersonalityProfile[]) => void;
}

export const PersonalityConfig: React.FC<PersonalityConfigProps> = ({ 
  profiles, 
  selectedProfileId, 
  onSelect, 
  onUpdate 
}) => {
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  const addProfile = () => {
    const newProfile: PersonalityProfile = {
      id: Date.now().toString(),
      name: 'Nuevo Perfil',
      systemPrompt: 'Eres un asistente útil.',
      avatar: 'Bot'
    };
    onUpdate([...profiles, newProfile]);
    setEditingProfileId(newProfile.id);
  };

  const deleteProfile = (id: string) => {
    if (profiles.length <= 1) return;
    onUpdate(profiles.filter(p => p.id !== id));
    if (selectedProfileId === id) {
      onSelect(profiles[0].id);
    }
  };

  return (
    <div className="space-y-6 pb-12 min-h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono uppercase opacity-50">Perfiles de Personalidad</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-6 rounded-none border-[#141414] text-[8px] font-mono uppercase"
          onClick={addProfile}
        >
          <Plus className="w-3 h-3 mr-1" /> Nuevo
        </Button>
      </div>

      <div className="space-y-3">
        {profiles.map((profile) => (
          <div 
            key={profile.id} 
            className={cn(
              "border border-[#141414] transition-all",
              selectedProfileId === profile.id ? "bg-[#141414]/5 ring-1 ring-[#141414]" : "bg-white/50"
            )}
          >
            <div className="p-3 flex items-center justify-between gap-3">
              <div 
                className="flex-1 flex items-center gap-3 cursor-pointer"
                onClick={() => onSelect(profile.id)}
              >
                <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] flex items-center justify-center rounded-sm">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold uppercase">{profile.name}</span>
                  <span className="text-[8px] font-mono opacity-50 truncate max-w-[120px]">
                    {profile.systemPrompt.slice(0, 40)}...
                  </span>
                </div>
              </div>
              
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-none hover:bg-[#141414] hover:text-[#E4E3E0]"
                  onClick={() => setEditingProfileId(editingProfileId === profile.id ? null : profile.id)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                {profiles.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-none hover:bg-red-600 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProfile(profile.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {editingProfileId === profile.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3 pb-3 space-y-3 border-t border-[#141414]/20 pt-3"
                >
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono uppercase opacity-50">Nombre</label>
                    <Input 
                      value={profile.name}
                      onChange={(e) => {
                        onUpdate(profiles.map(p => p.id === profile.id ? { ...p, name: e.target.value } : p));
                      }}
                      className="h-7 text-[10px] font-mono rounded-none border-[#141414] bg-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono uppercase opacity-50">System Prompt</label>
                    <textarea 
                      value={profile.systemPrompt}
                      onChange={(e) => {
                        onUpdate(profiles.map(p => p.id === profile.id ? { ...p, systemPrompt: e.target.value } : p));
                      }}
                      className="w-full min-h-[100px] text-[10px] font-mono rounded-none border border-[#141414] bg-transparent p-2 focus:ring-0"
                    />
                  </div>
                  <Button 
                    className="w-full h-7 text-[8px] font-mono uppercase rounded-none bg-[#141414] text-[#E4E3E0]"
                    onClick={() => setEditingProfileId(null)}
                  >
                    <Save className="w-3 h-3 mr-2" /> Guardar Perfil
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};
