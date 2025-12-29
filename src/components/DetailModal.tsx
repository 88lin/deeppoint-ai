import { useEffect } from "react";

interface ClusterResult {
  id: string;
  size: number;
  analysis: {
    one_line_pain: string;
    paid_interest: "High" | "Medium" | "Low";
    rationale: string;
    potential_product: string;

    // 新增深度分析维度
    pain_depth?: {
      surface_pain: string;
      root_causes: string[];
      user_scenarios: string[];
      emotional_intensity: number;
    };

    market_landscape?: {
      existing_solutions: Array<{
        name: string;
        limitation: string;
      }>;
      unmet_needs: string[];
      opportunity: string;
    };

    mvp_plan?: {
      core_features: string[];
      validation_hypotheses: Array<{
        hypothesis: string;
        test_method: string;
      }>;
      first_users: string;
      timeline: string;
      estimated_cost: string;
    };

    keyword_relevance?: number;
  };
  representative_texts: string[];
  priority_score?: {
    demand_intensity: number;
    market_size: number;
    competition: number;
    overall: number;
    level: 'High' | 'Medium' | 'Low';
  };
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ClusterResult | null;
}

export default function DetailModal({ isOpen, onClose, result }: DetailModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const getBadgeClass = (interest: "High" | "Medium" | "Low") => {
    switch (interest) {
      case "High":
        return "bg-amber-100 text-amber-800";
      case "Medium":
        return "bg-gray-100 text-gray-600";
      case "Low":
        return "bg-green-100 text-green-800";
    }
  };

  if (!isOpen || !result) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Content */}
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl z-10 overflow-hidden transform transition-all scale-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-[#FBFBF9]/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getBadgeClass(result.analysis.paid_interest)}`}>
                {result.analysis.paid_interest} Intent
              </span>
              <span className="text-xs text-gray-400 font-mono">
                #Cluster-{result.id.slice(0, 6)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#18181B] leading-snug">
              {result.analysis.one_line_pain}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#18181B] p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto hide-scroll space-y-8">
          {/* 优先级评分卡片 */}
          {result.priority_score && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                优先级评分
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">需求强度</div>
                  <div className="text-2xl font-bold text-red-600">{result.priority_score.demand_intensity.toFixed(1)}</div>
                  <div className="text-xs text-gray-400 mt-1">/ 5.0</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">市场规模</div>
                  <div className="text-2xl font-bold text-blue-600">{result.priority_score.market_size.toFixed(1)}</div>
                  <div className="text-xs text-gray-400 mt-1">/ 5.0</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">竞争度</div>
                  <div className="text-2xl font-bold text-green-600">{result.priority_score.competition.toFixed(1)}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {result.priority_score.competition >= 4.5 ? '🔵 蓝海' :
                     result.priority_score.competition >= 3.0 ? '🟡 中等' : '🔴 红海'}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">综合得分</span>
                  <span className="text-3xl font-bold text-amber-600">{result.priority_score.overall.toFixed(1)}/5.0</span>
                </div>
              </div>
            </div>
          )}

          {/* 维度1: 痛点深度挖掘 */}
          {result.analysis.pain_depth && (
            <div className="bg-red-50 rounded-xl p-5 border border-red-100">
              <h3 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                💡 痛点深度挖掘
              </h3>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-xs text-gray-500 font-semibold mb-2">表面痛点</div>
                  <p className="text-sm text-gray-700">{result.analysis.pain_depth.surface_pain}</p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="text-xs text-gray-500 font-semibold mb-2">根因分析（3个"为什么"）</div>
                  <div className="space-y-2">
                    {result.analysis.pain_depth.root_causes.map((cause, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <p className="text-sm text-gray-700 flex-1">{cause}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-xs text-gray-500 font-semibold mb-2">用户场景</div>
                    <ul className="space-y-1">
                      {result.analysis.pain_depth.user_scenarios.map((scenario, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>{scenario}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="text-xs text-gray-500 font-semibold mb-2">情绪强度</div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${star <= result.analysis.pain_depth!.emotional_intensity ? 'text-red-500' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-700">
                        {result.analysis.pain_depth.emotional_intensity}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 维度2: 市场与竞品分析 */}
          {result.analysis.market_landscape && (
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                🏪 市场格局分析
              </h3>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-xs text-gray-500 font-semibold mb-3">现有解决方案</div>
                  <div className="space-y-3">
                    {result.analysis.market_landscape.existing_solutions.map((solution, index) => (
                      <div key={index} className="border-l-4 border-blue-300 pl-4">
                        <div className="text-sm font-semibold text-gray-700">{solution.name}</div>
                        <div className="text-xs text-red-600 mt-1">⚠️ 局限: {solution.limitation}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="text-xs text-gray-500 font-semibold mb-2">未满足的需求</div>
                  <ul className="space-y-1.5">
                    {result.analysis.market_landscape.unmet_needs.map((need, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5 font-bold">▸</span>
                        <span>{need}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg p-4 border border-amber-200">
                  <div className="text-xs text-amber-800 font-semibold mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    市场机会
                  </div>
                  <p className="text-sm text-amber-900 font-medium">{result.analysis.market_landscape.opportunity}</p>
                </div>
              </div>
            </div>
          )}

          {/* 维度3: MVP执行方案 */}
          {result.analysis.mvp_plan && (
            <div className="bg-green-50 rounded-xl p-5 border border-green-100">
              <h3 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                🚀 MVP执行方案
              </h3>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-xs text-gray-500 font-semibold mb-3">核心功能</div>
                  <ul className="space-y-2">
                    {result.analysis.mvp_plan.core_features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="text-xs text-gray-500 font-semibold mb-3">验证假设</div>
                  <div className="space-y-3">
                    {result.analysis.mvp_plan.validation_hypotheses.map((item, index) => (
                      <div key={index} className="border-l-4 border-green-300 pl-4">
                        <div className="text-xs text-gray-500 font-medium">假设 {index + 1}</div>
                        <div className="text-sm text-gray-700 mt-1">{item.hypothesis}</div>
                        <div className="text-xs text-blue-600 mt-1">→ 测试方法: {item.test_method}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-semibold mb-1">首批用户</div>
                    <p className="text-sm text-gray-700">{result.analysis.mvp_plan.first_users}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-semibold mb-1">时间预估</div>
                    <p className="text-sm text-gray-700">{result.analysis.mvp_plan.timeline}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-semibold mb-1">成本预估</div>
                    <p className="text-sm text-gray-700">{result.analysis.mvp_plan.estimated_cost}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reason Block */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              分析依据
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              {result.analysis.rationale}
            </p>
          </div>

          {/* Product Idea Block */}
          <div>
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI 产品构想
            </h3>
            <div className="pl-4 border-l-2 border-amber-400">
              <p className="text-[#18181B] text-lg font-medium">
                {result.analysis.potential_product}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="bg-[#FBFBF9] rounded-xl p-4 flex-1">
              <div className="text-xs text-gray-500 font-medium">样本数量</div>
              <div className="text-2xl font-bold text-[#18181B] mt-1">{result.size}</div>
            </div>
            <div className="bg-[#FBFBF9] rounded-xl p-4 flex-1">
              <div className="text-xs text-gray-500 font-medium">原文数量</div>
              <div className="text-2xl font-bold text-[#18181B] mt-1">{result.representative_texts.length}</div>
            </div>
            {result.analysis.keyword_relevance !== undefined && (
              <div className="bg-[#FBFBF9] rounded-xl p-4 flex-1">
                <div className="text-xs text-gray-500 font-medium">相关度</div>
                <div className="text-2xl font-bold text-[#18181B] mt-1">{result.analysis.keyword_relevance}%</div>
              </div>
            )}
          </div>

          {/* Comments List */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">代表性原文</h3>
            <div className="space-y-3">
              {result.representative_texts.map((text, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-600 bg-white border border-gray-100 p-3 rounded-lg shadow-sm flex items-start gap-3"
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
