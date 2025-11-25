import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Shield, ShieldOff, Check, Search, GitBranch, Loader2 } from 'lucide-react';
import { familyService } from '../services/familyService';
import { FamilyAccount, LinkRequest } from '../types';
import { normalizeDate } from '../utils';

interface LinkManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentFamily: FamilyAccount;
}

const LinkManager: React.FC<LinkManagerProps> = ({ isOpen, onClose, currentFamily }) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incoming, setIncoming] = useState<LinkRequest[]>([]);
  const [outgoing, setOutgoing] = useState<LinkRequest[]>([]);
  const [networkLinks, setNetworkLinks] = useState<LinkRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Request Form
  const [targetCode, setTargetCode] = useState('');
  const [requestMsg, setRequestMsg] = useState('');

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, currentFamily.code]);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const inc = await familyService.getIncomingRequests(currentFamily.code);
      const out = await familyService.getOutgoingRequests(currentFamily.code);
      const net = await familyService.getFamilyNetworkLinks(currentFamily.code);
      setIncoming(inc);
      setOutgoing(out);
      setNetworkLinks(net);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCode) return;
    
    const rootName = currentFamily.root.name;
    const rootYear = normalizeDate(currentFamily.root.birthDate).split('-')[0];

    setIsLoading(true);
    try {
      const success = await familyService.requestLink(currentFamily.code, targetCode, rootName, rootYear);
      if (success) {
        setRequestMsg("申请已发送，等待对方审核。");
        setTargetCode('');
        await refresh();
      } else {
        setRequestMsg("申请失败：不能挂靠自己或请求已存在。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setIsLoading(true);
    await familyService.approveRequest(id);
    await refresh();
    setIsLoading(false);
  };

  const handleReject = async (id: string) => {
    setIsLoading(true);
    await familyService.rejectRequest(id);
    await refresh();
    setIsLoading(false);
  };

  const toggleVisibility = async (id: string, currentHidden: boolean) => {
    setIsLoading(true);
    await familyService.toggleLinkVisibility(id, !currentHidden);
    await refresh();
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl flex flex-col h-[600px]">
        
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-china-red" /> 家族挂靠管理
          </h2>
          <button onClick={onClose} className="hover:bg-gray-200 rounded-full p-1"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex border-b border-gray-200">
           <button 
             onClick={() => setActiveTab('incoming')}
             className={`flex-1 py-3 font-medium text-sm ${activeTab === 'incoming' ? 'text-china-red border-b-2 border-china-red' : 'text-gray-500'}`}
           >
             全网审批与管理
           </button>
           <button 
             onClick={() => setActiveTab('outgoing')}
             className={`flex-1 py-3 font-medium text-sm ${activeTab === 'outgoing' ? 'text-china-red border-b-2 border-china-red' : 'text-gray-500'}`}
           >
             申请挂靠 (我发起的)
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 relative">
           {isLoading && (
              <div className="absolute top-2 right-2">
                <Loader2 className="w-4 h-4 animate-spin text-china-red" />
              </div>
           )}

           {activeTab === 'incoming' && (
             <div className="space-y-6">
                {/* Pending List (Only direct requests to ME) */}
                <div>
                   <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                     <span className="bg-yellow-500 w-2 h-2 rounded-full"></span> 待我审批的申请
                   </h3>
                   {incoming.length === 0 && <p className="text-sm text-gray-400 pl-4">暂无待审批申请</p>}
                   <div className="space-y-3">
                      {incoming.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <span className="font-bold text-china-red">申请方: {req.fromFamilyCode}</span>
                                 <p className="text-sm text-gray-600 mt-1">
                                    起始人: <strong>{req.targetName}</strong> (年份: {req.targetBirthYear})
                                 </p>
                              </div>
                              <div className="flex gap-2">
                                 <button onClick={() => handleReject(req.id)} className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100">拒绝</button>
                                 <button onClick={() => handleApprove(req.id)} className="px-3 py-1 text-xs bg-china-red text-white rounded hover:bg-red-900">同意挂靠</button>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Network Links */}
                <div className="pt-4 border-t border-gray-200">
                   <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                     <span className="bg-green-500 w-2 h-2 rounded-full"></span> 家族网络分支概览 (全网)
                   </h3>
                   {networkLinks.length === 0 && <p className="text-sm text-gray-400 pl-4">暂无已挂靠的分支家族</p>}
                   <div className="space-y-3">
                      {networkLinks.map(req => {
                        const isDirect = req.toFamilyCode === currentFamily.code;
                        return (
                        <div key={req.id} className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center shadow-sm">
                           <div className="flex items-center gap-3">
                              <GitBranch className={`w-5 h-5 ${isDirect ? 'text-blue-500' : 'text-gray-400'}`} />
                              <div className="flex flex-col">
                                <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                   <span className="bg-gray-100 px-1 rounded">{req.fromFamilyCode}</span>
                                   <span className="text-gray-400 text-xs">→</span> 
                                   <span className={`bg-gray-100 px-1 rounded ${isDirect ? 'text-blue-600 font-bold ring-1 ring-blue-100' : ''}`}>
                                      {req.toFamilyCode === currentFamily.code ? '我' : req.toFamilyCode}
                                   </span>
                                </div>
                                <span className="text-xs text-gray-500 mt-0.5">连接点: {req.targetName}</span>
                              </div>
                           </div>
                           <button 
                             onClick={() => toggleVisibility(req.id, !!req.isHidden)}
                             className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition ${req.isHidden ? 'bg-gray-200 text-gray-600' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'}`}
                             title={req.isHidden ? "点击取消屏蔽" : "点击屏蔽该分支"}
                           >
                              {req.isHidden ? <ShieldOff className="w-3 h-3"/> : <Shield className="w-3 h-3"/>}
                              {req.isHidden ? '已屏蔽' : '显示中'}
                           </button>
                        </div>
                      )})}
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'outgoing' && (
             <div className="space-y-6">
                <div className="bg-white p-4 rounded border border-gray-200">
                   <h3 className="font-bold text-gray-800 mb-3">申请挂靠到主家族</h3>
                   <form onSubmit={handleRequestSubmit} className="space-y-3">
                      <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">目标主家族代码</label>
                         <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={targetCode}
                              onChange={e => setTargetCode(e.target.value)}
                              placeholder="输入对方 Family Code"
                              className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white text-gray-900"
                            />
                            <button type="submit" disabled={isLoading} className="bg-china-red text-white px-4 rounded text-sm hover:bg-red-900 disabled:opacity-50">申请</button>
                         </div>
                      </div>
                      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                         <span className="font-bold text-blue-600">提示：</span> 
                         您的起始祖先 ({currentFamily.root.name}, {normalizeDate(currentFamily.root.birthDate).split('-')[0]}年) 
                         必须在对方族谱中存在。
                      </div>
                      {requestMsg && <p className="text-xs text-green-600">{requestMsg}</p>}
                   </form>
                </div>

                <div>
                   <h3 className="font-bold text-gray-700 mb-3">我的申请记录</h3>
                   {outgoing.length === 0 && <p className="text-sm text-gray-400">暂无申请</p>}
                   <div className="space-y-2">
                      {outgoing.map(req => (
                         <div key={req.id} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                            <span className="text-sm">申请挂靠到 <strong>{req.toFamilyCode}</strong></span>
                            <span className={`text-xs px-2 py-1 rounded ${
                               req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                               req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                               {req.status === 'approved' ? '已通过' : req.status === 'rejected' ? '被拒绝' : '审核中'}
                            </span>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default LinkManager;
