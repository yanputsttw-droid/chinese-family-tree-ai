import React, { useState, useRef } from 'react';
import { X, Search, Edit2, Trash2, Plus, Upload, Save, Image as ImageIcon, Lock, CornerDownLeft, Loader2 } from 'lucide-react';
import { Person } from '../types';
import { flattenTree, isDescendant } from '../utils';
import { Logger } from '../logger';

interface MemberManagerProps {
  isOpen: boolean;
  onClose: () => void;
  root: Person;
  onUpdateMember: (id: string, updates: Partial<Person>) => Promise<void>;
  onAddMember: (parentId: string, newMember: Person) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  currentFamilyCode: string;
}

const MemberManager: React.FC<MemberManagerProps> = ({ 
  isOpen, onClose, root, onUpdateMember, onAddMember, onDeleteMember, currentFamilyCode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingChildToId, setAddingChildToId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Person>>({});
  const [parentTargetId, setParentTargetId] = useState<string>(''); 

  const fileInputRef = useRef<HTMLInputElement>(null);
  const spouseFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const allMembers = flattenTree(root);
  const filteredMembers = allMembers.filter(m => 
    (m.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({});
    setEditingId(null);
    setAddingChildToId(null);
    setParentTargetId('');
    setIsSaving(false);
  };

  const canEdit = (member: Person) => {
    return !member.originFamilyCode || member.originFamilyCode === currentFamilyCode;
  };

  const handleStartEdit = (member: Person) => {
    if (!canEdit(member)) {
      alert("无法修改挂靠家族的成员信息，请联系该家族管理员。");
      return;
    }
    setEditingId(member.id);
    setAddingChildToId(null);
    setFormData({ ...member });
    setParentTargetId(''); 
    Logger.info(`开始编辑成员: ${member.name} (ID: ${member.id})`);
  };

  const handleStartAdd = (parentId: string) => {
    const parent = allMembers.find(m => m.id === parentId);
    setAddingChildToId(parentId);
    setEditingId(null);
    setFormData({
      name: '',
      gender: 'male',
      birthDate: '',
      spouse: '',
      photoUrl: '',
      originFamilyCode: currentFamilyCode 
    });
    Logger.info(`准备为 ${parent?.name || parentId} 添加子嗣`);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.birthDate) {
      alert("请填写名称和出生日期");
      return;
    }
    
    setIsSaving(true);
    try {
      if (editingId) {
        if (parentTargetId && parentTargetId !== 'root') {
           await onUpdateMember(editingId, { ...formData, newParentId: parentTargetId } as any);
        } else {
           await onUpdateMember(editingId, formData);
        }
      } else if (addingChildToId) {
        const newMember: Person = {
          id: `new_${Date.now()}`,
          name: formData.name!,
          gender: formData.gender as 'male' | 'female',
          birthDate: formData.birthDate!,
          deathDate: formData.deathDate,
          spouse: formData.spouse,
          spouseBirthDate: formData.spouseBirthDate,
          spouseDeathDate: formData.spouseDeathDate,
          spousePhotoUrl: formData.spousePhotoUrl,
          photoUrl: formData.photoUrl,
          originFamilyCode: currentFamilyCode,
          children: []
        };
        await onAddMember(addingChildToId, newMember);
      }
      resetForm();
    } catch (e) {
       console.error(e);
       alert("保存失败");
    } finally {
       setIsSaving(false);
    }
  };

  const handleDelete = async (member: Person) => {
    if (!canEdit(member)) {
      alert("权限不足：无法删除挂靠成员。");
      return;
    }
    if (member.id === root.id) {
      alert("无法删除根节点（家族祖先）");
      return;
    }
    if (confirm("确定要删除该成员吗？其所有后代也将被移除。")) {
      setIsSaving(true);
      await onDeleteMember(member.id);
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isSpouse: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (isSpouse) {
           setFormData(prev => ({ ...prev, spousePhotoUrl: ev.target?.result as string }));
        } else {
           setFormData(prev => ({ ...prev, photoUrl: ev.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-china-red text-white">
          <h2 className="text-xl font-bold font-serif">成员管理 (Member Management)</h2>
          <button onClick={onClose} className="hover:bg-red-800 p-2 rounded-full transition"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Panel: List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="搜索成员..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-china-red bg-white text-gray-900"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredMembers.map(member => {
                const allowed = canEdit(member);
                return (
                <div 
                  key={member.id} 
                  className={`p-3 border-b border-gray-100 flex items-center justify-between hover:bg-white transition ${editingId === member.id ? 'bg-red-50 border-l-4 border-l-china-red' : ''} ${!allowed ? 'opacity-70 bg-gray-100' : ''}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shrink-0 ${member.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                       {member.photoUrl ? (
                         <img src={member.photoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                       ) : (
                         (member.name || '?')[0]
                       )}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-gray-800 text-sm flex items-center gap-1">
                        {member.name || '未知'}
                        {!allowed && <Lock className="w-3 h-3 text-gray-400"/>}
                      </div>
                      <div className="text-xs text-gray-500">{member.birthDate}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {allowed && (
                       <button onClick={() => handleStartEdit(member)} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="编辑"><Edit2 className="w-3.5 h-3.5" /></button>
                    )}
                    <button onClick={() => handleStartAdd(member.id)} className="p-1.5 hover:bg-green-100 rounded text-green-600" title="添加子嗣"><Plus className="w-3.5 h-3.5" /></button>
                    {member.id !== root.id && allowed && (
                       <button onClick={() => handleDelete(member)} className="p-1.5 hover:bg-red-100 rounded text-red-600" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* Right Panel: Form */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            {isSaving && (
               <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-china-red" />
               </div>
            )}

            {(editingId || addingChildToId) ? (
              <div className="space-y-6 max-w-lg mx-auto pb-10">
                 <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <div className="p-2 bg-china-red/10 rounded-lg text-china-red">
                       {editingId ? <Edit2 className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {editingId ? '编辑成员信息' : '添加新成员'}
                    </h3>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex justify-center mb-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden hover:border-china-red transition">
                            {formData.photoUrl ? (
                              <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center text-gray-400">
                                <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                                <span className="text-xs">上传照片</span>
                              </div>
                            )}
                          </div>
                          <input type="file" ref={fileInputRef} onChange={(e) => handlePhotoUpload(e, false)} accept="image/*" className="hidden" />
                        </div>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                      <input 
                        type="text" 
                        value={formData.name || ''} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                      <select 
                        value={formData.gender || 'male'} 
                        onChange={e => setFormData({...formData, gender: e.target.value as 'male'|'female'})}
                        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                      >
                        <option value="male">男</option>
                        <option value="female">女</option>
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">出生日期 *</label>
                      <input 
                        type="date" 
                        value={formData.birthDate || ''} 
                        onChange={e => setFormData({...formData, birthDate: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">离世日期 (选填)</label>
                      <input 
                        type="date" 
                        value={formData.deathDate || ''} 
                        onChange={e => setFormData({...formData, deathDate: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                      />
                    </div>

                    {editingId && editingId !== root.id && (
                      <div className="col-span-2 mt-2 bg-yellow-50 p-3 rounded border border-yellow-100">
                         <label className="block text-xs font-bold text-yellow-800 mb-1 flex items-center gap-1">
                           <CornerDownLeft className="w-3 h-3"/> 归属父母 (变更节点位置)
                         </label>
                         <select 
                           value={parentTargetId} 
                           onChange={e => setParentTargetId(e.target.value)}
                           className="w-full p-2 border border-yellow-300 rounded text-sm bg-white text-gray-900"
                         >
                           <option value="">保持原样 (不移动)</option>
                           {allMembers
                              .filter(m => 
                                m.id !== editingId && 
                                !isDescendant(root, editingId, m.id) &&
                                (!m.originFamilyCode || m.originFamilyCode === currentFamilyCode)
                              ) 
                              .map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.birthDate})
                                </option>
                              ))
                           }
                         </select>
                      </div>
                    )}
                 </div>

                 {/* Spouse Fields */}
                 <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">配偶信息</h4>
                    
                    <div className="flex gap-4 items-start">
                        <div className="shrink-0 text-center">
                           <div className="w-16 h-16 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => spouseFileInputRef.current?.click()}>
                              {formData.spousePhotoUrl ? (
                                <img src={formData.spousePhotoUrl} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-gray-400" />
                              )}
                           </div>
                           <input type="file" ref={spouseFileInputRef} onChange={(e) => handlePhotoUpload(e, true)} accept="image/*" className="hidden" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 flex-1">
                           <div className="col-span-2">
                             <label className="block text-sm font-medium text-gray-700 mb-1">配偶姓名</label>
                             <input 
                               type="text" 
                               value={formData.spouse || ''} 
                               onChange={e => setFormData({...formData, spouse: e.target.value})}
                               className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                             />
                           </div>
                           
                           <div className="col-span-1">
                             <label className="block text-sm font-medium text-gray-700 mb-1">配偶出生</label>
                             <input 
                               type="date" 
                               value={formData.spouseBirthDate || ''} 
                               onChange={e => setFormData({...formData, spouseBirthDate: e.target.value})}
                               className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                             />
                           </div>

                           <div className="col-span-1">
                             <label className="block text-sm font-medium text-gray-700 mb-1">配偶离世</label>
                             <input 
                               type="date" 
                               value={formData.spouseDeathDate || ''} 
                               onChange={e => setFormData({...formData, spouseDeathDate: e.target.value})}
                               className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"
                             />
                           </div>
                        </div>
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                    <button onClick={resetForm} disabled={isSaving} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-china-red text-white rounded hover:bg-red-900 flex items-center gap-2 shadow-sm disabled:opacity-50">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} 保存
                    </button>
                 </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Edit2 className="w-8 h-8 text-gray-300" />
                 </div>
                 <p>请在左侧列表选择成员进行编辑</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberManager;
