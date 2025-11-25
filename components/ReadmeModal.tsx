
import React from 'react';
import { X, CheckCircle, List, User, Activity, FileSpreadsheet } from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-parchment w-full max-w-2xl rounded-lg shadow-2xl border-2 border-china-red/30 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-parchment z-10">
          <h2 className="text-2xl font-bold font-serif text-china-red flex items-center gap-2">
            <List className="w-6 h-6" /> 项目需求说明 (README)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <section>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-800">
              <span className="bg-china-red text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              数据管理
            </h3>
            <ul className="space-y-3 ml-2">
              <li className="flex items-start gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600 mt-0.5" />
                <span><strong className="text-gray-900">Excel 导入/导出:</strong> 支持 .xlsx 格式。</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <span><strong className="text-gray-900">必要字段:</strong> 名称, 性别, 出生日期, 父亲, 母亲。</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <span><strong className="text-gray-900">可选字段:</strong> 离世日期, 配偶。</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-800">
              <span className="bg-china-red text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              卡片展示细节
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-2">
              <div className="p-3 bg-orange-50 rounded border border-orange-100">
                <User className="w-4 h-4 text-china-red mb-1" />
                <span className="font-semibold block">视觉区分</span>
                <span className="text-sm text-gray-600">
                   <span className="text-blue-600">蓝(男)</span> / <span className="text-pink-600">粉(女)</span> / <span className="text-gray-600 font-bold">黑(已故)</span>
                </span>
              </div>
              <div className="p-3 bg-orange-50 rounded border border-orange-100">
                <Activity className="w-4 h-4 text-china-red mb-1" />
                <span className="font-semibold block">谓称计算</span>
                <span className="text-sm text-gray-600">支持 伯父/姑姑/表亲/堂亲 等复杂关系</span>
              </div>
              <div className="p-3 bg-orange-50 rounded border border-orange-100">
                <span className="font-semibold block">家庭状况</span>
                <span className="text-sm text-gray-600">特殊夫妻连线、子嗣统计(X男X女)</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-800">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">AI</span>
              Gemini 智能集成
            </h3>
            <ul className="space-y-2 ml-2 text-sm text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <li>• <strong>智能助手 (Chat):</strong> 使用 Gemini 2.5 Flash Lite 提供快速家族历史问答。</li>
              <li>• <strong>深度推理 (Reasoning):</strong> 使用 Gemini 3.0 Pro Preview (Thinking Mode) 分析复杂亲属关系。</li>
              <li>• <strong>老照片分析 (Vision):</strong> 使用 Gemini 3.0 Pro 识别老照片中的人物特征和年代感。</li>
              <li>• <strong>图像编辑:</strong> 使用 Gemini 2.5 Flash Image 修复或滤镜化家族照片。</li>
            </ul>
          </section>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-china-red hover:bg-red-900 text-white px-6 py-2 rounded-md font-medium transition shadow-lg flex items-center gap-2"
          >
            开始构建族谱 <span className="text-xl">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadmeModal;
