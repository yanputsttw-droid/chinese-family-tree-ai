
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Cake, CloudRain } from 'lucide-react';
import { ChatMessage, Person } from '../types';
import { getFastResponse } from '../services/geminiService';
import { getUpcomingBirthdays, getUpcomingDeathAnniversaries, flattenTree } from '../utils';

interface AIAssistantProps {
  treeRoot?: Person; // Optional, can be passed to check tree data locally
}

const AIAssistant: React.FC<AIAssistantProps> = ({ treeRoot }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', content: '您好！我是您的家族历史智能助手。我已经读取了当前的族谱数据，您可以问我关于成员关系、生日、长幼排序等问题。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper to create a textual context of the family tree for the AI
  const buildFamilyContext = (root: Person): string => {
    const members = flattenTree(root);
    let context = "当前家族树数据 (Family Tree Data):\n";
    members.forEach(m => {
       const gender = m.gender === 'male' ? '男' : '女';
       const status = m.deathDate ? `已故 (${m.deathDate})` : '在世';
       const spouseInfo = m.spouse ? `, 配偶: ${m.spouse}` : '';
       const parentNames = []; // Note: flattenTree doesn't easily give parent names back unless we track them, 
                               // but we can infer relationships or just list raw data.
                               // Ideally, we list children.
       const childrenNames = m.children.map(c => c.name).join(', ');
       
       context += `- 姓名: ${m.name} (ID: ${m.id}), 性别: ${gender}, 出生: ${m.birthDate}, 状态: ${status}${spouseInfo}`;
       if (childrenNames) context += `, 子女: [${childrenNames}]`;
       context += "\n";
    });
    return context;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      type: 'text'
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build System Prompt with Context
      let systemInstruction = "你是一个专业的家族历史助手。请根据以下家族成员数据回答用户的问题。如果问题无法根据数据回答，请如实告知。";
      
      if (treeRoot) {
         systemInstruction += "\n\n" + buildFamilyContext(treeRoot);
      }

      const fullPrompt = `${systemInstruction}\n\n用户问题: ${input}`;
      
      const aiResponseText = await getFastResponse(fullPrompt);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: aiResponseText
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "抱歉，由于网络问题，我暂时无法回答。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckBirthdays = () => {
    if (!treeRoot) return;
    const upcoming = getUpcomingBirthdays(treeRoot);
    let msgContent = "";
    
    if (upcoming.length === 0) {
      msgContent = "🎉 最近 7 天内没有家族成员过生日。";
    } else {
      msgContent = "🎂 **未来 7 天内过生日的存活成员：**\n\n" + upcoming.map(u => {
        return `• **${u.name}**\n  生日：${u.nextDate}\n  即将年满：${u.turningAge} 岁 (${u.daysUntil === 0 ? '今天' : u.daysUntil + '天后'})`;
      }).join('\n\n');
    }

    setMessages(prev => [...prev, {
       id: Date.now().toString(),
       role: 'model',
       content: msgContent
    }]);
  };

  const handleCheckDeathAnniversaries = () => {
    if (!treeRoot) return;
    const upcoming = getUpcomingDeathAnniversaries(treeRoot);
    let msgContent = "";
    
    if (upcoming.length === 0) {
      msgContent = "🌧️ 最近 30 天内没有家族成员的忌日。";
    } else {
      msgContent = "🌧️ **未来 30 天内的亲人忌日 (缅怀)：**\n\n" + upcoming.map(u => {
        return `• **${u.name}**\n  忌日：${u.anniversaryDate}\n  离开我们：${u.years} 年 (${u.daysUntil === 0 ? '今天' : u.daysUntil + '天后'})`;
      }).join('\n\n');
    }

    setMessages(prev => [...prev, {
       id: Date.now().toString(),
       role: 'model',
       content: msgContent
    }]);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl w-full md:w-96">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold-accent" /> 
          AI 宗族助手
        </h2>
        
        {/* Helper Action Buttons */}
        <div className="mt-3 pt-2 border-t border-gray-200 flex gap-2">
           <button 
             onClick={handleCheckBirthdays}
             className="flex-1 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition border border-pink-200"
             title="7天内"
           >
              <Cake className="w-3 h-3" /> 近期生日
           </button>
           <button 
             onClick={handleCheckDeathAnniversaries}
             className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition border border-gray-300"
             title="30天内"
           >
              <CloudRain className="w-3 h-3" /> 近期忌日
           </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-gray-400 mb-1 px-1">
               {msg.role === 'user' ? '我' : 'AI 家族助手'}
            </span>
            <div 
              className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-china-red text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-gray-400 mb-1 px-1">AI 家族助手</span>
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
               <Loader2 className="w-5 h-5 animate-spin text-china-red" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="询问家族历史..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-china-red/50 bg-white text-gray-900"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="bg-china-red hover:bg-red-900 text-white p-2 rounded-full transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
