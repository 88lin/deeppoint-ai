#!/usr/bin/env python3
"""
语义聚类服务 - 基于智谱AI Embedding + DBSCAN
替代原有的 Jaccard 聚类算法，提供更好的语义相似度聚类
"""

import json
import sys
import os
import re
import time
import logging
from typing import List, Dict, Optional, Tuple
from pathlib import Path

import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_distances
from sklearn.metrics import silhouette_score, davies_bouldin_score

# 加载环境变量
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent
load_dotenv(env_path / '.env.local')
load_dotenv(env_path / '.env')

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ==================== 数据清洗模块 ====================

class DataCleaner:
    """高信噪比数据清洗器"""

    # 无效社交用语（会被直接过滤）
    NOISE_PATTERNS = [
        r'^哈+$',           # 纯哈哈哈
        r'^嘻+$',           # 纯嘻嘻嘻
        r'^呵+$',           # 纯呵呵呵
        r'^[好棒赞]+$',     # 纯好棒赞
        r'^支持+$',
        r'^加油+$',
        r'^蹲+$',
        r'^@\S+',           # @某人
        r'^转发微博',
        r'^已阅$',
        r'^mark$',
        r'^[Mm]ark$',
        r'^收藏$',
        r'^[啊哦嗯唔额]+$',  # 纯语气词
        r'^[\d\.]+$',       # 纯数字
        r'^👍❤️💕🎉😀😁😂🤣😃😄😅😆😊😋😎💪👏🙏✨🌟⭐️🔥💯🎊🎁🎈🌈☀️🌙⚡️💫\s*]+$',  # 纯表情
    ]

    # 无效短语列表（通用社交表达）
    NOISE_PHRASES = [
        # 纯赞美
        '好听', '好看', '真好', '不错', '可以', '厉害', '牛', '绝了', '太棒了', '太强了',
        '666', '牛逼', '牛批', '真棒', '真好', '真不错',

        # 纯情绪
        '哈哈哈', '哈哈哈哈', '笑死', '笑了', '太好笑', '绝绝子', '哭了', '爱了',

        # 追更类
        '蹲', '蹲一个', '等更新', '催更', '什么时候更新',

        # 占位类
        '第一', '沙发', '前排', '来了', '打卡', '签到', '路过',

        # 口号类
        '支持', '加油', '冲', '冲冲冲', '奥利给', 'yyds', '永远的神',

        # 无实质内容的疑问
        '啥', '啥意思', '什么意思', '啥玩意', '这是啥', '真的吗', '真假',
        '是吗', '吗', '呢', '吧', '呀', '啊',

        # 身份询问/无关评论
        '是谁', '谁啊', '不认识', '这谁', '博主是谁',

        # 广告营销相关
        '私信', '私信我', '加V', '加微信', '加好友', '点击链接', '扫码',
    ]

    # 白名单关键词（优先保留）- 通用痛点相关词汇
    WHITELIST_KEYWORDS = [
        # 问题表达
        '怎么', '如何', '为什么', '为啥', '难', '坑', '麻烦', '导致', '问题', '解决',

        # 需求表达
        '求', '希望', '建议', '推荐', '想要', '需要', '能不能', '可以吗', '有没有',

        # 学习困难
        '不懂', '不会', '学不会', '太难', '搞不懂', '看不懂', '理解不了',

        # 体验问题
        '后悔', '避雷', '踩坑', '被坑', '不好用', '失望', '糟糕',

        # 价格敏感
        '贵', '便宜', '平替', '替代', '省钱', '划算', '性价比', '值吗', '值得吗',

        # 质量投诉
        '吐槽', '差评', '退款', '售后', '客服', '质量', '坏了', '不行',

        # 技术问题
        'bug', 'BUG', '卡', '闪退', '崩溃', '报错', '异常', '失败', '无法',

        # 对比选择
        '哪个', '哪里', '选择', '区别', '对比', '还是',

        # 教程指导
        '教程', '步骤', '方法', '攻略', '指南', '教学',
    ]

    def __init__(self, min_length: int = 4):
        self.min_length = min_length
        self.noise_regexes = [re.compile(p) for p in self.NOISE_PATTERNS]

    def is_noise(self, text: str) -> bool:
        """判断文本是否为噪音"""
        text = text.strip()

        # 长度过短
        if len(text) < self.min_length:
            return True

        # 匹配噪音正则
        for regex in self.noise_regexes:
            if regex.match(text):
                return True

        # 匹配噪音短语
        text_lower = text.lower()
        for phrase in self.NOISE_PHRASES:
            if text_lower == phrase.lower():
                return True

        return False

    def has_whitelist_keyword(self, text: str) -> bool:
        """检查是否包含白名单关键词"""
        for keyword in self.WHITELIST_KEYWORDS:
            if keyword in text:
                return True
        return False

    def calculate_score(self, text: str) -> float:
        """
        计算文本质量分数（用于排序和筛选代表性文本）
        分数越高，文本越有价值
        """
        score = 1.0
        length = len(text)

        # 白名单关键词加权（痛点相关）
        if self.has_whitelist_keyword(text):
            score += 2.0

        # 长度加权（50-200字符最佳，有实质内容）
        if 50 <= length <= 200:
            score += 1.0
        elif 20 <= length < 50:
            score += 0.5
        elif 10 <= length < 20:
            score += 0.2
        elif length > 300:
            score -= 0.5  # 过长的文本可能是复制粘贴

        # 包含问号加权（可能是真实问题）
        question_marks = text.count('?') + text.count('？')
        if question_marks > 0:
            # 但如果是纯疑问词+问号（无实质内容），则扣分
            simple_questions = ['啥', '什么意思', '真的吗', '是吗', '这是啥', '谁啊']
            is_simple_question = any(q in text for q in simple_questions) and length < 15
            if is_simple_question:
                score -= 1.0
            else:
                score += 0.3 * min(question_marks, 2)  # 最多加0.6分

        # 包含数字加权（可能包含具体数据/价格）
        if re.search(r'\d+', text):
            score += 0.3

        # 包含感叹号过多扣分（可能是情绪化表达）
        exclamation_marks = text.count('!') + text.count('！')
        if exclamation_marks > 2:
            score -= 0.5

        return score

    def clean(self, texts: List[str]) -> Tuple[List[str], List[float]]:
        """
        清洗文本列表
        返回: (清洗后的文本列表, 对应的质量分数)
        """
        cleaned = []
        scores = []
        seen = set()  # 去重

        for text in texts:
            text = text.strip()

            # 跳过空文本
            if not text:
                continue

            # 去重
            if text in seen:
                continue
            seen.add(text)

            # 跳过噪音
            if self.is_noise(text):
                continue

            score = self.calculate_score(text)
            cleaned.append(text)
            scores.append(score)

        logger.info(f"数据清洗完成: {len(texts)} -> {len(cleaned)} 条 (过滤了 {len(texts) - len(cleaned)} 条噪音)")
        return cleaned, scores


# ==================== Embedding 模块 ====================

class ZhipuEmbedding:
    """智谱AI Embedding 服务"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GLM_API_KEY')
        if not self.api_key:
            raise ValueError("未找到 GLM_API_KEY，请在 .env.local 或环境变量中配置")

        self.base_url = "https://open.bigmodel.cn/api/paas/v4/embeddings"
        self.model = os.getenv('GLM_EMBEDDING_MODEL', 'embedding-3')
        self.batch_size = 25  # 每批最大数量
        self.rate_limit_delay = 0.5  # 请求间隔（秒）

    def _get_embedding_batch(self, texts: List[str]) -> List[List[float]]:
        """获取一批文本的 embedding"""
        import urllib.request
        import urllib.error

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        # 智谱 API 需要逐个请求
        embeddings = []
        for text in texts:
            data = json.dumps({
                'model': self.model,
                'input': text
            }).encode('utf-8')

            req = urllib.request.Request(self.base_url, data=data, headers=headers)

            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    embedding = result['data'][0]['embedding']
                    embeddings.append(embedding)
            except urllib.error.HTTPError as e:
                error_body = e.read().decode('utf-8')
                logger.error(f"API 错误: {e.code} - {error_body}")
                raise
            except Exception as e:
                logger.error(f"请求失败: {e}")
                raise

            # 添加延迟避免限流
            time.sleep(self.rate_limit_delay)

        return embeddings

    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        获取文本列表的 embedding 向量
        自动处理批量请求和限流
        """
        if not texts:
            return np.array([])

        all_embeddings = []
        total_batches = (len(texts) + self.batch_size - 1) // self.batch_size

        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            batch_num = i // self.batch_size + 1
            logger.info(f"正在获取 Embedding: 批次 {batch_num}/{total_batches} ({len(batch)} 条)")

            embeddings = self._get_embedding_batch(batch)
            all_embeddings.extend(embeddings)

        return np.array(all_embeddings)


# ==================== 聚类模块 ====================

def optimize_clustering_params(
    embeddings: np.ndarray,
    eps_range: List[float] = [0.2, 0.25, 0.3],
    min_samples_range: Optional[List[int]] = None
) -> Tuple[float, int]:
    """
    自动优化DBSCAN聚类参数

    参数:
        embeddings: 向量矩阵
        eps_range: eps候选值列表
        min_samples_range: min_samples候选值列表（为None时自动生成）

    返回:
        (最优eps, 最优min_samples)
    """
    if len(embeddings) < 10:
        logger.warning("数据量太少，使用默认参数")
        return 0.25, 3

    # 自动生成min_samples候选值
    if min_samples_range is None:
        base_min_samples = max(3, len(embeddings) // 50)
        min_samples_range = [
            max(2, base_min_samples - 1),
            base_min_samples,
            base_min_samples + 1
        ]

    logger.info(f"开始参数优化：尝试 {len(eps_range)} × {len(min_samples_range)} = {len(eps_range) * len(min_samples_range)} 组参数")

    # 预计算距离矩阵（避免重复计算）
    distance_matrix = cosine_distances(embeddings)

    best_score = -1
    best_params = (0.25, 3)
    best_n_clusters = 0

    for eps in eps_range:
        for min_samples in min_samples_range:
            try:
                # 执行聚类
                dbscan = DBSCAN(eps=eps, min_samples=min_samples, metric='precomputed')
                labels = dbscan.fit_predict(distance_matrix)

                # 统计聚类数量
                n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
                n_noise = list(labels).count(-1)

                # 至少需要2个聚类才能计算silhouette
                if n_clusters < 2:
                    continue

                # 过滤噪音点
                non_noise_mask = labels != -1
                if np.sum(non_noise_mask) <= n_clusters:
                    continue

                # 计算silhouette score
                score = silhouette_score(
                    embeddings[non_noise_mask],
                    labels[non_noise_mask],
                    metric='cosine'
                )

                logger.info(f"  eps={eps}, min_samples={min_samples}: {n_clusters}簇, {n_noise}噪音, score={score:.4f}")

                # 更新最优参数（优先考虑score，其次考虑聚类数量）
                if score > best_score or (score == best_score and n_clusters > best_n_clusters):
                    best_score = score
                    best_params = (eps, min_samples)
                    best_n_clusters = n_clusters

            except Exception as e:
                logger.debug(f"参数 eps={eps}, min_samples={min_samples} 失败: {e}")
                continue

    if best_score > -1:
        logger.info(f"✓ 找到最优参数: eps={best_params[0]}, min_samples={best_params[1]}, score={best_score:.4f}")
        return best_params
    else:
        logger.warning("参数优化失败，使用默认参数")
        return 0.25, max(3, len(embeddings) // 50)


class SemanticClusterer:
    """基于 DBSCAN 的语义聚类器"""

    def __init__(self, eps: float = 0.25, min_samples: int = 3):
        """
        参数:
            eps: DBSCAN 的邻域半径（基于余弦距离，0.2-0.3 较好，降低以提高聚类严格度）
            min_samples: 形成聚类的最小样本数（建议根据数据量动态调整）
        """
        self.eps = eps
        self.min_samples = min_samples

    def cluster(self, embeddings: np.ndarray, texts: List[str], scores: Optional[List[float]] = None) -> List[Dict]:
        """
        执行 DBSCAN 聚类

        返回格式:
        [
            {
                "representative_text": "距离聚类中心最近的文本",
                "size": 聚类大小,
                "texts": ["文本1", "文本2", ...]
            },
            ...
        ]
        """
        if len(embeddings) == 0:
            return []

        if scores is None:
            scores = [1.0] * len(texts)

        # 计算余弦距离矩阵
        logger.info("正在计算余弦距离矩阵...")
        distance_matrix = cosine_distances(embeddings)

        # DBSCAN 聚类
        logger.info(f"正在执行 DBSCAN 聚类 (eps={self.eps}, min_samples={self.min_samples})...")
        dbscan = DBSCAN(eps=self.eps, min_samples=self.min_samples, metric='precomputed')
        labels = dbscan.fit_predict(distance_matrix)

        # 统计聚类结果
        unique_labels = set(labels)
        n_clusters = len([l for l in unique_labels if l != -1])
        n_noise = list(labels).count(-1)
        logger.info(f"聚类完成: {n_clusters} 个聚类, {n_noise} 个噪音点")

        # 计算聚类质量指标（仅当有多个聚类时）
        if n_clusters > 1:
            # 过滤掉噪音点用于评估
            non_noise_mask = labels != -1
            if np.sum(non_noise_mask) > n_clusters:
                try:
                    # Silhouette分数：-1到1，越接近1越好
                    silhouette = silhouette_score(
                        embeddings[non_noise_mask],
                        labels[non_noise_mask],
                        metric='cosine'
                    )
                    logger.info(f"Silhouette Score: {silhouette:.4f} (范围: -1到1, 越高越好)")

                    # Davies-Bouldin指数：越小越好，0为最优
                    db_index = davies_bouldin_score(
                        embeddings[non_noise_mask],
                        labels[non_noise_mask]
                    )
                    logger.info(f"Davies-Bouldin Index: {db_index:.4f} (越小越好)")

                    # 质量评估提示
                    if silhouette > 0.5:
                        logger.info("✓ 聚类质量：优秀（簇间分离度高）")
                    elif silhouette > 0.3:
                        logger.info("✓ 聚类质量：良好（簇较为明确）")
                    elif silhouette > 0.1:
                        logger.info("⚠ 聚类质量：一般（簇边界模糊）")
                    else:
                        logger.warning("⚠ 聚类质量：较差（可能需要调整参数）")

                except Exception as e:
                    logger.warning(f"无法计算聚类质量指标: {e}")
        else:
            logger.warning("聚类数量过少，无法计算质量指标")

        # 构建聚类结果
        clusters = {}
        for idx, label in enumerate(labels):
            if label == -1:  # 噪音点单独处理
                continue
            if label not in clusters:
                clusters[label] = {
                    'indices': [],
                    'texts': [],
                    'scores': []
                }
            clusters[label]['indices'].append(idx)
            clusters[label]['texts'].append(texts[idx])
            clusters[label]['scores'].append(scores[idx])

        # 为每个聚类找出代表性文本
        results = []
        for label, cluster_data in clusters.items():
            indices = cluster_data['indices']
            cluster_texts = cluster_data['texts']
            cluster_scores = cluster_data['scores']

            # 计算聚类中心
            cluster_embeddings = embeddings[indices]
            centroid = np.mean(cluster_embeddings, axis=0)

            # 找到距离中心最近的文本
            distances_to_center = cosine_distances([centroid], cluster_embeddings)[0]

            # 综合距离和质量分数选择代表文本
            combined_scores = []
            for i, (dist, score) in enumerate(zip(distances_to_center, cluster_scores)):
                # 距离越小越好（取反），分数越高越好
                combined = -dist + score * 0.3
                combined_scores.append(combined)

            best_idx = np.argmax(combined_scores)
            representative_text = cluster_texts[best_idx]

            # 去重后的文本列表
            unique_texts = list(dict.fromkeys(cluster_texts))

            results.append({
                'representative_text': representative_text,
                'size': len(unique_texts),
                'texts': unique_texts
            })

        # 按聚类大小排序
        results.sort(key=lambda x: x['size'], reverse=True)

        # 后处理：过滤掉过小的聚类（至少需要3条数据才有统计意义）
        min_cluster_size = 3
        filtered_results = [r for r in results if r['size'] >= min_cluster_size]

        if len(filtered_results) < len(results):
            removed_count = len(results) - len(filtered_results)
            logger.info(f"过滤掉 {removed_count} 个过小聚类（size < {min_cluster_size}），保留 {len(filtered_results)} 个有意义的聚类")

        # 记录被过滤的高质量噪音点数量（用于调试）
        noise_indices = [i for i, label in enumerate(labels) if label == -1]
        high_quality_noise = sum(1 for idx in noise_indices if scores[idx] >= 2.0)
        if high_quality_noise > 0:
            logger.info(f"过滤掉 {high_quality_noise} 个高质量但未聚类的文本（可考虑放宽参数以获得更多聚类）")

        return filtered_results


# ==================== 主流程 ====================

def process_texts(
    texts: List[str],
    eps: Optional[float] = None,
    min_samples: Optional[int] = None,
    min_length: int = 4,
    auto_optimize: bool = False
) -> List[Dict]:
    """
    完整的文本处理流程：清洗 -> Embedding -> 聚类

    参数:
        texts: 文本列表
        eps: DBSCAN邻域半径（None时自动计算）
        min_samples: 最小样本数（None时自动计算）
        min_length: 最小文本长度
        auto_optimize: 是否自动优化聚类参数
    """
    if not texts:
        return []

    # 1. 数据清洗
    logger.info("开始数据清洗...")
    cleaner = DataCleaner(min_length=min_length)
    cleaned_texts, scores = cleaner.clean(texts)

    if not cleaned_texts:
        logger.warning("清洗后没有有效文本")
        return []

    # 2. 获取 Embedding
    logger.info("开始获取 Embedding...")
    embedder = ZhipuEmbedding()
    embeddings = embedder.get_embeddings(cleaned_texts)

    # 3. 参数优化（如果启用）
    if auto_optimize:
        logger.info("启用参数自动优化...")
        eps, min_samples = optimize_clustering_params(embeddings)
    else:
        # 动态计算 eps（如果未指定）
        if eps is None:
            # 根据数据量自适应调整 eps
            data_size = len(cleaned_texts)
            if data_size < 20:
                eps = 0.45  # 极小数据集：非常宽松
                logger.info(f"极小数据集({data_size}条)，使用较大eps={eps}以确保能形成聚类")
            elif data_size < 50:
                eps = 0.38  # 小数据集：较宽松
                logger.info(f"小数据集({data_size}条)，使用较大eps={eps}以避免过度分散")
            elif data_size < 100:
                eps = 0.30  # 中等数据集
                logger.info(f"中等数据集({data_size}条)，使用中等eps={eps}")
            else:
                eps = 0.25  # 大数据集：更严格
                logger.info(f"大数据集({data_size}条)，使用较小eps={eps}以提高聚类严格度")

        # 动态计算 min_samples（如果未指定）
        if min_samples is None:
            # 根据数据量自适应：至少3个样本以保证聚类有意义
            data_size = len(cleaned_texts)
            if data_size < 15:
                min_samples = 3  # 极小数据集：仍然保持3，避免2条就成簇
            elif data_size < 50:
                min_samples = 3  # 小数据集
            elif data_size < 100:
                min_samples = 4  # 中等数据集提高要求
            else:
                min_samples = max(5, data_size // 50)  # 大数据集：至少5
            logger.info(f"动态计算 min_samples: {min_samples} (基于 {data_size} 条清洗后的文本)")

    # 4. DBSCAN 聚类
    logger.info("开始语义聚类...")
    clusterer = SemanticClusterer(eps=eps, min_samples=min_samples)
    clusters = clusterer.cluster(embeddings, cleaned_texts, scores)

    logger.info(f"处理完成，共 {len(clusters)} 个聚类")
    return clusters


def main():
    """命令行入口"""
    import argparse

    parser = argparse.ArgumentParser(description='语义聚类服务')
    parser.add_argument('--input', '-i', type=str, help='输入 JSON 文件路径')
    parser.add_argument('--output', '-o', type=str, help='输出 JSON 文件路径')
    parser.add_argument('--eps', type=float, default=None, help='DBSCAN eps 参数（邻域半径，为None时根据数据量自动调整）')
    parser.add_argument('--min-samples', type=int, default=None, help='DBSCAN min_samples 参数（为None时自动计算）')
    parser.add_argument('--min-length', type=int, default=4, help='最小文本长度')
    parser.add_argument('--auto-optimize', action='store_true', help='自动优化聚类参数')
    parser.add_argument('--stdin', action='store_true', help='从标准输入读取 JSON')

    args = parser.parse_args()

    # 读取输入
    if args.stdin:
        input_data = json.loads(sys.stdin.read())
    elif args.input:
        with open(args.input, 'r', encoding='utf-8') as f:
            input_data = json.load(f)
    else:
        parser.error("请指定 --input 或 --stdin")
        return

    # 支持两种输入格式：直接数组或 {"texts": [...]}
    if isinstance(input_data, list):
        texts = input_data
    else:
        texts = input_data.get('texts', [])

    # 处理
    try:
        results = process_texts(
            texts,
            eps=args.eps,
            min_samples=args.min_samples,
            min_length=args.min_length,
            auto_optimize=args.auto_optimize
        )

        output = {
            'success': True,
            'clusters': results,
            'total_clusters': len(results),
            'total_texts': sum(c['size'] for c in results)
        }
    except Exception as e:
        logger.error(f"处理失败: {e}")
        output = {
            'success': False,
            'error': str(e),
            'clusters': []
        }

    # 输出结果
    result_json = json.dumps(output, ensure_ascii=False, indent=2)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(result_json)
        logger.info(f"结果已保存到 {args.output}")
    else:
        print(result_json)


if __name__ == '__main__':
    main()
