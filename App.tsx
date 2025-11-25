import React, { useState, useEffect } from 'react';
import { INITIAL_DATA } from './constants';
import FamilyNode from './components/FamilyNode';
import ReadmeModal from './components/ReadmeModal';
import AIAssistant from './components/AIAssistant';
import MemberManager from './components/MemberManager';
import LogViewer from './components/LogViewer';
import AuthModal from './components/AuthModal';
import LinkManager from './components/LinkManager';
import { Menu, Upload, MessageSquare, UserCircle, Download, FileSpreadsheet, Users, Edit2, Check, ClipboardList, Link as LinkIcon, Search, RefreshCw, LogOut, Loader2 } from 'lucide-react';
import { FamilyAccount, FamilyTreeData, Person } from './types';
import { parseExcel, exportExcel, downloadTemplate, updateNodeInTree, addNodeToTree, deleteNodeFromTree, moveNodeInTree } from './utils';
import { Logger } from './logger';
import { familyService } from './services/familyService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<FamilyAccount | null>(null);
  const [data, setData] = useState<FamilyTreeData>(INITIAL_DATA);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // UI State
  const [showReadme, setShowReadme] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [showManager, setShowManager] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Search & Locate
  const [searchQuery, setSearchQuery] = useState('');
  // const [searchResults, setSearchResults] = useState<Person[]>([]); // Unused warning fix

  // Editable Title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  // Auth Check & Data Load
  useEffect(() => {
    if (currentUser) {
      loadTreeData();
    }
  }, [currentUser, showLinks]); 

  const loadTreeData = async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      const tree = await familyService.getMergedTreeData(currentUser.code);
      if (tree) {
        setData(tree);
      } else {
        // Fallback to local data if merge fails or returns null
        setData({ root: currentUser.root, name: currentUser.name });
      }
    } catch (e) {
      Logger.error("Failed to load tree data", e);
      alert("加载家族数据失败，请检查网络连接。");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleManualRefresh = () => {
    Logger.info("用户手动刷新数据...");
    loadTreeData();
    Logger.success("家族数据刷新请求已发送");
  };

  const handleLogin = (account: FamilyAccount) => {
    setCurrentUser(account);
    Logger.success(`用户 ${account.name} 登录成功`);
  };

  const handleLogout = () => {
    Logger.info(`用户 ${currentUser?.name} 退出登录`);
    setCurrentUser(null);
    setData(INITIAL_DATA);
    setSelectedId(null);
    setShowAI(false);
    setShowManager(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (file) {
      Logger.info("用户开始导入文件", { fileName: file.name, size: file.size });
      setIsLoadingData(true);
      try {
        const newData = await parseExcel(file);
        if (newData) {
          // Tag new data with current family code
          const tagRoot = (node: Person): Person => ({
             ...node,
             originFamilyCode: currentUser.code,
             children: node.children.map(tagRoot)
          });
          const taggedRoot = tagRoot(newData.root);
          
          // Update Service
          await familyService.updateFamilyTree(currentUser.code, taggedRoot);
          
          // Reload
          await loadTreeData();
          
          setSelectedId(null);
          Logger.success("家族数据导入成功并更新");
          alert("家族 Excel 数据导入成功！");
        } else {
          Logger.error("导入失败：数据解析为空");
          alert("导入失败，请查看日志。");
          setShowLogs(true);
        }
      } catch (err: any) {
        Logger.error("文件导入错误", err);
        alert("无法解析文件。");
        setShowLogs(true);
      } finally {
        setIsLoadingData(false);
      }
    }
  };

  const handleExport = () => {
    exportExcel(data);
  };

  const handleNodeSelect = (id: string) => {
    setSelectedId(id === selectedId ? null : id);
  };

  // --- CRUD Handlers (Async) ---
  
  const handleUpdateMember = async (id: string, updates: Partial<Person> & { newParentId?: string }) => {
    if (!currentUser) return;
    Logger.info(`App received update for ID: ${id}`);
    setIsLoadingData(true);
    
    try {
      // 1. Get RAW tree
      let rawRoot = await familyService.getFamilyRoot(currentUser.code);
      if (!rawRoot) {
          throw new Error("Failed to load raw family data");
      }

      // Handle Move Logic on RAW tree
      if (updates.newParentId) {
        Logger.info(`Moving node ${id} to parent ${updates.newParentId} in raw tree`);
        const movedRoot = moveNodeInTree(rawRoot, id, updates.newParentId);
        if (movedRoot) {
          rawRoot = movedRoot;
        } else {
          alert("移动失败：目标父母节点可能属于挂靠家族，无法跨家族移动成员。");
          setIsLoadingData(false);
          return;
        }
        delete updates.newParentId;
      }

      // Update Node props
      rawRoot = updateNodeInTree(rawRoot, id, updates);
      
      // 2. Save Raw Tree
      await familyService.updateFamilyTree(currentUser.code, rawRoot);
      
      // 3. Reload Merged View
      await loadTreeData();
      Logger.success("Member updated and tree reloaded");
    } catch (e) {
      Logger.error("Update failed", e);
      alert("更新失败，请重试");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddMember = async (parentId: string, newMember: Person) => {
    if (!currentUser) return;
    Logger.info(`App received add request.`);
    setIsLoadingData(true);

    try {
      // 1. Get RAW tree
      let rawRoot = await familyService.getFamilyRoot(currentUser.code);
      if (!rawRoot) throw new Error("Missing raw root");

      // 2. Add to Raw Tree
      rawRoot = addNodeToTree(rawRoot, parentId, newMember);

      // 3. Save
      await familyService.updateFamilyTree(currentUser.code, rawRoot);

      // 4. Reload Merged View
      await loadTreeData();
      Logger.success("New member added and tree reloaded");
    } catch (e) {
      Logger.error("Add failed", e);
      alert("添加失败");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!currentUser) return;
    Logger.info(`App received delete request for ID: ${id}`);
    setIsLoadingData(true);

    try {
      // 1. Get RAW tree
      let rawRoot = await familyService.getFamilyRoot(currentUser.code);
      if (!rawRoot) throw new Error("Missing raw root");

      // 2. Delete from Raw Tree
      rawRoot = deleteNodeFromTree(rawRoot, id);

      // 3. Save
      await familyService.updateFamilyTree(currentUser.code, rawRoot);

      // 4. Reload
      await loadTreeData();
      if (selectedId === id) setSelectedId(null);
      Logger.success("Member deleted and tree reloaded");
    } catch (e) {
      Logger.error("Delete failed", e);
      alert("删除失败");
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- Search ---
  const handleSearch = (e: React.FormEvent) => {
     e.preventDefault();
     if (!searchQuery.trim()) return;
     
     const results: Person[] = [];
     const search = (node: Person) => {
        if (node.name.includes(searchQuery)) results.push(node);
        node.children.forEach(search);
     };
     search(data.root);
     
     // setSearchResults(results); // Unused
     if (results.length > 0) {
        setSelectedId(results[0].id);
        scrollToNode(results[0].id);
     } else {
        alert("未找到该成员");
     }
  };

  const scrollToNode = (id: string) => {
     setTimeout(() => {
        const el = document.getElementById(`node-${id}`);
        if (el) {
           el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
     }, 100);
  };

  // --- Title Editing ---
  const handleTitleClick = () => {
    setTempTitle(data.name);
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (tempTitle.trim()) {
      setData({ ...data, name: tempTitle });
      if (currentUser) {
        // In real app, call API update
        // Here we just update local state visually, assumed name change isn't persisted to DB in this specific simplified flow
        // or we could add a familyService.updateName() method.
        // For now, let's just update client state to reflect.
        currentUser.name = tempTitle; 
      }
    }
    setIsEditingTitle(false);
  };

  if (!currentUser) {
    return <AuthModal onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-pattern overflow-hidden">
      {/* Top Navigation */}
      <header className="h-16 bg-china-red text-parchment flex items-center justify-between px-6 shadow-md z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gold-accent rounded-full flex items-center justify-center text-china-red font-bold font-serif border-2 border-white" title={`Code: ${currentUser.code}`}>
            {data.name.substring(0, 1)}
          </div>
          
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="bg-white text-gray-900 px-2 py-1 rounded font-calligraphy text-xl outline-none border border-gold-accent w-64 shadow-inner"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              />
              <button onClick={handleTitleSave} className="hover:bg-green-600 rounded-full p-1 bg-green-500 text-white"><Check className="w-4 h-4"/></button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 cursor-pointer group" 
              onClick={handleTitleClick}
              title="点击修改家族名称"
            >
              <h1 className="text-2xl font-calligraphy tracking-wider hidden md:block group-hover:text-gold-accent transition">
                {data.name}
              </h1>
              <span className="text-xs bg-red-900 px-2 py-0.5 rounded opacity-60">{currentUser.code}</span>
              <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-50 transition" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
           {selectedId && (
              <div className="hidden lg:flex items-center gap-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs animate-fadeIn mr-2">
                <UserCircle className="w-4 h-4"/>
                <span>已切换视角: <b>我</b></span>
                <button 
                  onClick={() => setSelectedId(null)}
                  className="ml-2 hover:text-gold-accent underline"
                >
                  重置
                </button>
              </div>
           )}

           <button 
             onClick={() => setShowLogs(true)}
             className="flex items-center gap-2 cursor-pointer transition px-3 py-1.5 rounded-md bg-white/10 text-white hover:bg-white/20"
             title="查看系统日志"
           >
              <ClipboardList className="w-4 h-4" />
           </button>

           <button 
             onClick={handleManualRefresh}
             className="flex items-center gap-2 cursor-pointer transition px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-500"
             title="刷新数据 / 同步互联状态"
           >
              {isLoadingData ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4" />} 
              <span className="hidden sm:inline">刷新</span>
           </button>

           <button 
             onClick={() => setShowLinks(true)}
             className="flex items-center gap-2 cursor-pointer transition px-3 py-1.5 rounded-md bg-blue-600 text-white font-bold hover:bg-blue-500"
             title="家族挂靠管理"
           >
              <LinkIcon className="w-4 h-4" /> <span className="hidden sm:inline">家族互联</span>
           </button>

          <button 
            onClick={() => setShowManager(true)}
            className="flex items-center gap-2 cursor-pointer transition px-3 py-1.5 rounded-md bg-white text-china-red font-bold hover:bg-gold-accent hover:text-white"
          >
             <Users className="w-4 h-4" /> <span className="hidden sm:inline">成员管理</span>
          </button>

          <div className="flex items-center bg-white/10 rounded-md overflow-hidden">
             <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 cursor-pointer hover:bg-white/20 transition px-3 py-1.5 border-r border-white/10"
                title="下载 Excel 导入模板"
             >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">模板</span>
             </button>
             <label className={`flex items-center gap-2 cursor-pointer hover:bg-white/20 transition px-3 py-1.5 border-r border-white/10 ${isLoadingData ? 'opacity-50 cursor-not-allowed' : ''}`} title="导入 Excel">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">导入</span>
                <input type="file" onChange={handleImport} accept=".xlsx, .xls" className="hidden" disabled={isLoadingData} />
             </label>
             <button 
                onClick={handleExport}
                className="flex items-center gap-2 cursor-pointer hover:bg-white/20 transition px-3 py-1.5"
                title="导出 Excel"
             >
                <Download className="w-4 h-4" />
             </button>
          </div>
          
          <button 
            onClick={() => setShowReadme(true)}
            className="flex items-center gap-2 cursor-pointer hover:text-gold-accent transition bg-white/10 px-3 py-1.5 rounded-md"
            title="需求文档"
          >
             <Menu className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setShowAI(!showAI)}
            className={`flex items-center gap-2 cursor-pointer transition px-3 py-1.5 rounded-md ${showAI ? 'bg-parchment text-china-red font-bold' : 'bg-white/10 hover:text-gold-accent'}`}
            title="AI 助手"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">AI 助手</span>
          </button>

          <div className="h-6 w-px bg-white/20 mx-1"></div>

          <button 
             onClick={handleLogout}
             className="flex items-center gap-2 cursor-pointer transition px-3 py-1.5 rounded-md bg-red-800 text-red-200 hover:bg-red-900 hover:text-white"
             title="退出登录"
           >
              <LogOut className="w-4 h-4" />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Loading Overlay */}
        {isLoadingData && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg backdrop-blur">
             <Loader2 className="w-4 h-4 animate-spin" />
             <span className="text-xs">数据同步中...</span>
          </div>
        )}

        {/* Search Widget - Top Left */}
        <div className="absolute top-6 left-6 z-30 bg-white/90 backdrop-blur shadow-lg rounded-lg p-2 flex items-center gap-2 border border-gray-200">
           <Search className="w-4 h-4 text-gray-500" />
           <form onSubmit={handleSearch} className="flex gap-2">
              <input 
                type="text" 
                placeholder="定位成员..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 text-sm bg-white text-gray-900 outline-none rounded px-1"
              />
              <button type="submit" className="text-xs bg-china-red text-white px-2 py-1 rounded">Go</button>
           </form>
        </div>

        {/* Tree Canvas */}
        <div 
          className="flex-1 overflow-auto p-10 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] bg-parchment relative cursor-grab active:cursor-grabbing"
          onClick={() => setSelectedId(null)}
        >
           <div className="absolute top-10 left-10 text-9xl font-calligraphy text-red-900/5 select-none pointer-events-none">
              传承
           </div>

           <div className="min-w-fit min-h-fit flex justify-center pt-10 pb-20">
              <FamilyNode 
                member={data.root} 
                generation={1} 
                root={data.root}
                selectedId={selectedId}
                onSelect={handleNodeSelect}
                currentFamilyCode={currentUser.code}
              />
           </div>
        </div>

        {/* AI Sidebar */}
        {showAI && (
          <div className="w-96 relative z-10 h-full border-l border-gray-200 shadow-xl">
            <AIAssistant treeRoot={data.root} />
          </div>
        )}
      </main>

      <footer className="h-8 bg-gray-900 text-gray-400 text-xs flex items-center justify-center font-serif">
        <span>© 2024 智慧家族树 | Code: {currentUser.code}</span>
      </footer>

      <ReadmeModal isOpen={showReadme} onClose={() => setShowReadme(false)} />
      <LogViewer isOpen={showLogs} onClose={() => setShowLogs(false)} />
      <LinkManager isOpen={showLinks} onClose={() => setShowLinks(false)} currentFamily={currentUser} />
      
      <MemberManager 
        isOpen={showManager}
        onClose={() => setShowManager(false)}
        root={data.root}
        onUpdateMember={handleUpdateMember}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
        currentFamilyCode={currentUser.code}
      />
    </div>
  );
};

export default App;
