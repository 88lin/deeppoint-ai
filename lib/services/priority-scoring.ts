// 优先级评分系统
// 根据需求强度、市场规模、竞争度计算综合优先级

export interface PriorityScore {
  demand_intensity: number;  // 需求强度 0-5
  market_size: number;        // 市场规模 0-5
  competition: number;        // 竞争度 0-5 (反向指标，5=低竞争)
  overall: number;            // 综合得分 0-5
  level: 'High' | 'Medium' | 'Low';
}

export class PriorityScorer {
  /**
   * 计算需求强度（0-5分）
   * 基于聚类大小、情绪强度
   */
  calculateDemandIntensity(
    clusterSize: number,
    totalSize: number,
    emotionalIntensity: number
  ): number {
    // 基础分：基于聚类占比
    const sizeRatio = clusterSize / totalSize;
    const sizeScore = Math.min(5, sizeRatio * 10); // 10%占比 = 1分，最高5分

    // 情绪加成：0-5的情绪强度最多贡献1分
    const emotionBoost = (emotionalIntensity / 5) * 1.0;

    const total = Math.min(5, sizeScore + emotionBoost);
    return Math.round(total * 10) / 10; // 保留一位小数
  }

  /**
   * 计算市场规模（0-5分）
   * 基于搜索词热度和数据量
   */
  calculateMarketSize(
    keywords: string[],
    clusterSize: number,
    totalDataSize: number
  ): number {
    // 数据量不足时，给保守估计
    if (totalDataSize < 50) {
      return 2.5; // 数据不足，中等评分
    }

    // 热门关键词列表（启发式）
    const popularKeywords = [
      '旅行', '旅游', '健康', '养生', '教育', '学习', '工作', '职场',
      '娱乐', '游戏', '美食', '运动', '理财', '投资', '购物', '穿搭'
    ];

    // 判断是否为热门领域
    const isPopular = keywords.some(keyword =>
      popularKeywords.some(pk => keyword.includes(pk) || pk.includes(keyword))
    );

    // 基础分
    let baseScore = isPopular ? 4.0 : 3.0;

    // 数据量加成（数据越多越可信）
    const dataBoost = totalDataSize >= 200 ? 0.5 : totalDataSize >= 100 ? 0.3 : 0;

    // 聚类size加成（该聚类讨论度高）
    const sizeBoost = Math.min(0.5, clusterSize / 30);

    const total = Math.min(5, baseScore + dataBoost + sizeBoost);
    return Math.round(total * 10) / 10;
  }

  /**
   * 计算竞争度（0-5分，反向指标）
   * 5分=蓝海，0分=红海
   * 基于LLM分析的现有解决方案数量
   */
  calculateCompetition(existingSolutions: Array<{ name: string; limitation: string }>): number {
    const solutionCount = existingSolutions.length;

    // 过滤掉"待调研"、"解析失败"等无效方案
    const validSolutions = existingSolutions.filter(
      s => !s.name.includes('待调研') &&
           !s.name.includes('解析失败') &&
           !s.name.includes('API调用失败')
    );

    const validCount = validSolutions.length;

    // 评分规则
    if (validCount === 0) {
      return 5.0; // 蓝海，无竞品
    } else if (validCount === 1) {
      return 4.0; // 低竞争
    } else if (validCount === 2) {
      return 3.0; // 中等竞争
    } else if (validCount === 3) {
      return 2.0; // 较高竞争
    } else {
      return 1.0; // 红海
    }
  }

  /**
   * 计算综合优先级
   * 加权公式：需求40% + 市场30% + 竞争30%
   */
  calculatePriority(
    demandIntensity: number,
    marketSize: number,
    competition: number
  ): PriorityScore {
    const overall = demandIntensity * 0.4 + marketSize * 0.3 + competition * 0.3;

    let level: 'High' | 'Medium' | 'Low';
    if (overall >= 3.5) {
      level = 'High';
    } else if (overall >= 2.5) {
      level = 'Medium';
    } else {
      level = 'Low';
    }

    return {
      demand_intensity: demandIntensity,
      market_size: marketSize,
      competition: competition,
      overall: Math.round(overall * 10) / 10,
      level
    };
  }

  /**
   * 完整评分流程（一次性计算所有维度）
   */
  scoreCluster(params: {
    clusterSize: number;
    totalDataSize: number;
    emotionalIntensity: number;
    keywords: string[];
    existingSolutions: Array<{ name: string; limitation: string }>;
  }): PriorityScore {
    const demandScore = this.calculateDemandIntensity(
      params.clusterSize,
      params.totalDataSize,
      params.emotionalIntensity
    );

    const marketScore = this.calculateMarketSize(
      params.keywords,
      params.clusterSize,
      params.totalDataSize
    );

    const competitionScore = this.calculateCompetition(params.existingSolutions);

    return this.calculatePriority(demandScore, marketScore, competitionScore);
  }
}
