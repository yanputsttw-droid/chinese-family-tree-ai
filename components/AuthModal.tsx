import React, { useState } from 'react';
import { Users, Lock, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { familyService } from '../services/familyService';
import { FamilyAccount } from '../types';

interface AuthModalProps {
  onLogin: (account: FamilyAccount) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isRegister) {
        if (!code || !name) {
          throw new Error("请填写家族代码和名称");
        }
        const newAccount = await familyService.register(code, name, password);
        onLogin(newAccount);
      } else {
        if (!code) {
          throw new Error("请输入家族代码");
        }
        const account = await familyService.login(code, password);
        onLogin(account);
      }
    } catch (err: any) {
      setError(err.message || "操作失败，请检查网络或账号信息");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-pattern bg-parchment flex items-center justify-center p-4 z-[100]">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl border-2 border-china-red/20 overflow-hidden">
         <div className="bg-china-red p-6 text-center">
            <div className="w-16 h-16 bg-gold-accent rounded-full flex items-center justify-center text-white mx-auto mb-3 border-2 border-white shadow-lg">
               <Users className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white font-serif tracking-widest">智慧家族树</h1>
            <p className="text-red-100 text-sm mt-1">传承 · 连接 · 铭记</p>
         </div>
         
         <div className="p-8">
            <div className="flex gap-4 mb-6 border-b border-gray-200 pb-1">
               <button 
                 onClick={() => { setIsRegister(false); setError(''); }}
                 className={`flex-1 pb-2 text-center font-bold transition ${!isRegister ? 'text-china-red border-b-2 border-china-red' : 'text-gray-400'}`}
               >
                 登录家族
               </button>
               <button 
                 onClick={() => { setIsRegister(true); setError(''); }}
                 className={`flex-1 pb-2 text-center font-bold transition ${isRegister ? 'text-china-red border-b-2 border-china-red' : 'text-gray-400'}`}
               >
                 注册新家族
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">家族代码 (Family Code)</label>
                 <input 
                   type="text" 
                   value={code}
                   onChange={e => setCode(e.target.value)}
                   placeholder="例如: FAM888"
                   className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-china-red/50 outline-none bg-white text-gray-900"
                   disabled={isLoading}
                 />
               </div>

               {isRegister && (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">家族名称</label>
                   <input 
                     type="text" 
                     value={name}
                     onChange={e => setName(e.target.value)}
                     placeholder="例如: 陈氏家族"
                     className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-china-red/50 outline-none bg-white text-gray-900"
                     disabled={isLoading}
                   />
                 </div>
               )}

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRegister ? '管理员密码 (选填)' : '管理员密码'}
                 </label>
                 <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-china-red/50 outline-none bg-white text-gray-900"
                      disabled={isLoading}
                    />
                 </div>
               </div>

               {error && (
                 <div className="text-red-600 text-sm flex items-center gap-2 bg-red-50 p-2 rounded">
                    <AlertCircle className="w-4 h-4" /> {error}
                 </div>
               )}

               <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full bg-china-red hover:bg-red-900 text-white font-bold py-3 rounded shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : (isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />)}
                 {isRegister ? '创建家族' : '进入族谱'}
               </button>
            </form>
         </div>
      </div>
    </div>
  );
};

export default AuthModal;
