interface DataQualityInfo {
  level: 'reliable' | 'preliminary' | 'exploratory';
  totalDataSize: number;
  clusterCount: number;
  averageClusterSize: number;
}

interface DataQualityBannerProps {
  dataQuality: DataQualityInfo;
}

export default function DataQualityBanner({ dataQuality }: DataQualityBannerProps) {
  const { level, totalDataSize, clusterCount, averageClusterSize } = dataQuality;

  // 根据质量等级配置样式和文案
  const levelConfig = {
    reliable: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
      badgeColor: 'bg-green-100 text-green-700',
      title: '可靠样本',
      message: '数据规模充足，分析结果具有较高可信度',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    preliminary: {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-800',
      badgeColor: 'bg-amber-100 text-amber-700',
      title: '初步验证',
      message: '数据规模中等，建议增加数据量以提升分析可信度',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    exploratory: {
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-800',
      badgeColor: 'bg-orange-100 text-orange-700',
      title: '小样本探索',
      message: '数据规模较小，仅供探索性参考，强烈建议扩大样本量',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const config = levelConfig[level];

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-5 transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-start gap-4">
        {/* 图标 */}
        <div className={`flex-shrink-0 w-10 h-10 ${config.bgColor.replace('-50', '-100')} rounded-full flex items-center justify-center ${config.iconColor}`}>
          {config.icon}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-semibold ${config.textColor}`}>
              数据质量：{config.title}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}>
              {totalDataSize} 条数据
            </span>
          </div>

          <p className={`text-xs ${config.textColor} opacity-80 mb-3`}>
            {config.message}
          </p>

          {/* 数据统计 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-500 font-medium">数据总量</div>
              <div className={`text-lg font-bold ${config.textColor}`}>
                {totalDataSize}
              </div>
            </div>
            <div className="bg-white/50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-500 font-medium">聚类数</div>
              <div className={`text-lg font-bold ${config.textColor}`}>
                {clusterCount}
              </div>
            </div>
            <div className="bg-white/50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-500 font-medium">平均聚类大小</div>
              <div className={`text-lg font-bold ${config.textColor}`}>
                {averageClusterSize}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 建议提示 */}
      {level !== 'reliable' && (
        <div className="mt-4 pt-4 border-t border-current/10">
          <div className="flex items-start gap-2">
            <svg className={`w-4 h-4 ${config.iconColor} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className={`text-xs ${config.textColor}`}>
              <span className="font-semibold">建议：</span>
              {level === 'exploratory' ? (
                <span> 当前数据量较少（{'<'}50条），建议使用更相关的关键词或增加抓取数量以获得更可靠的分析结果</span>
              ) : (
                <span> 增加数据量至200+条以获得更稳定的聚类结果和更可靠的分析建议</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
