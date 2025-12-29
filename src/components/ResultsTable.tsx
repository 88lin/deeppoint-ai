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

interface ResultsTableProps {
  results: ClusterResult[];
  onRowClick: (result: ClusterResult) => void;
}

export default function ResultsTable({ results, onRowClick }: ResultsTableProps) {
  const getBadgeClass = (interest: "High" | "Medium" | "Low") => {
    switch (interest) {
      case "High":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "Medium":
        return "bg-gray-100 text-gray-600";
      case "Low":
        return "bg-green-100 text-green-800 border border-green-200";
    }
  };

  const getPriorityBadgeClass = (level: 'High' | 'Medium' | 'Low') => {
    switch (level) {
      case 'High':
        return "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30";
      case 'Medium':
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30";
      case 'Low':
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-500/30";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.0) return "text-red-600";
    if (score >= 3.5) return "text-orange-600";
    if (score >= 3.0) return "text-blue-600";
    return "text-gray-600";
  };

  if (results.length === 0) {
    return null;
  }

  // 按优先级分组
  const groupedResults = {
    High: results.filter(r => r.priority_score?.level === 'High'),
    Medium: results.filter(r => r.priority_score?.level === 'Medium'),
    Low: results.filter(r => r.priority_score?.level === 'Low'),
    Unknown: results.filter(r => !r.priority_score)
  };

  const renderGroup = (title: string, level: 'High' | 'Medium' | 'Low' | 'Unknown', items: ClusterResult[]) => {
    if (items.length === 0) return null;

    const groupColors = {
      High: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' },
      Medium: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' },
      Low: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'text-gray-600' },
      Unknown: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'text-gray-600' }
    };

    const colors = groupColors[level];

    return (
      <div key={level} className="space-y-4">
        {/* 分组标题 */}
        <div className={`flex items-center gap-3 ${colors.bg} ${colors.border} border rounded-xl px-4 py-3`}>
          <div className={`w-2 h-2 rounded-full ${colors.icon} ${level === 'High' ? 'animate-pulse' : ''}`}></div>
          <span className={`font-bold text-sm ${colors.text} uppercase tracking-wider`}>
            {title} Priority
          </span>
          <span className={`ml-auto ${colors.text} text-xs font-semibold`}>
            {items.length} {items.length === 1 ? 'opportunity' : 'opportunities'}
          </span>
        </div>

        {/* 卡片列表 */}
        <div className="space-y-3">
          {items.map((result, index) => (
            <div
              key={result.id}
              onClick={() => onRowClick(result)}
              className="group bg-white rounded-2xl p-6 shadow-neuro border border-white hover:border-gray-200 transition-all cursor-pointer card-hover relative overflow-hidden"
            >
              {/* 顶部：标题 + 优先级徽章 */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col flex-1 mr-4">
                  <h4 className="font-bold text-lg text-[#18181B] mb-1 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {result.analysis.one_line_pain}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {result.analysis.potential_product}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {/* 优先级徽章 */}
                  {result.priority_score && (
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${getPriorityBadgeClass(result.priority_score.level)}`}>
                      🔥 {result.priority_score.level}
                    </div>
                  )}

                  {/* 付费意愿 */}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getBadgeClass(result.analysis.paid_interest)}`}>
                    $ {result.analysis.paid_interest}
                  </span>
                </div>
              </div>

              {/* 四维度概览 */}
              {result.priority_score && (
                <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-100">
                  {/* 需求强度 */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-medium mb-1">需求强度</div>
                    <div className={`text-2xl font-bold ${getScoreColor(result.priority_score.demand_intensity)}`}>
                      {result.priority_score.demand_intensity.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      情绪值: {result.analysis.pain_depth?.emotional_intensity || 'N/A'}/5
                    </div>
                  </div>

                  {/* 市场规模 */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-medium mb-1">市场规模</div>
                    <div className={`text-2xl font-bold ${getScoreColor(result.priority_score.market_size)}`}>
                      {result.priority_score.market_size.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      样本: {result.size}条
                    </div>
                  </div>

                  {/* 竞争度 */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-medium mb-1">竞争度</div>
                    <div className={`text-2xl font-bold ${getScoreColor(result.priority_score.competition)}`}>
                      {result.priority_score.competition.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {result.priority_score.competition >= 4.5 ? '🔵 蓝海' :
                       result.priority_score.competition >= 3.0 ? '🟡 中等' : '🔴 红海'}
                    </div>
                  </div>
                </div>
              )}

              {/* 关键洞察 */}
              {result.analysis.market_landscape?.opportunity && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <div className="text-xs font-semibold text-amber-800 mb-1">市场机会</div>
                      <p className="text-xs text-amber-700 line-clamp-2">
                        {result.analysis.market_landscape.opportunity}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 底部：元信息 + 查看按钮 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {result.size} signals
                  </span>
                  {result.priority_score && (
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {result.priority_score.overall.toFixed(1)}/5.0
                    </span>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-xs font-bold text-amber-600">
                  查看深度分析
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderGroup('High', 'High', groupedResults.High)}
      {renderGroup('Medium', 'Medium', groupedResults.Medium)}
      {renderGroup('Low', 'Low', groupedResults.Low)}
      {renderGroup('Unknown', 'Unknown', groupedResults.Unknown)}
    </div>
  );
}
