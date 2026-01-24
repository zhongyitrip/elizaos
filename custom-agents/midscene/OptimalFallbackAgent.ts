/**
 * 最优回退策略 Agent - 自定义实现
 *
 * 策略：免费优先 → 免费的快的优先 → 付费保底
 *
 * 回退顺序（全部启用缓存）：
 * 1. 阿里云 qwen2-vl-2b (免费额度, 5.2秒缓存, 100%, 缓存加速32%)
 * 2. 智谱 GLM-4.6V-Flash (免费, 7.8秒, 100%, 缓存有效)
 * 3. 智谱 GLM-4.1V-Thinking (免费, 备选, 缓存有效)
 * 4. 阿里云 qwen2-vl-7b (¥0.001, 8秒, 90%, 缓存有效)
 * 5. 阿里云 qwen-vl-plus (¥0.008, 3-5秒, 95%+, 缓存有效)
 *
 * 缓存功能：所有模型统一使用 Midscene 缓存，加速 30-50%
 * 注：Ollama本地模型已注释（CPU损耗 > API成本）
 */

import { Page } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

interface ModelConfig {
  name: string;
  provider: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  family: string;
  cost: number;
  timeout: number;
  description: string;
}

interface ExecutionResult {
  success: boolean;
  model: string;
  duration: number;
  cost: number;
  error?: string;
}

interface CacheConfig {
  enabled: boolean;
  id?: string;
  strategy?: 'read-write' | 'read-only' | 'write-only';
  cleanUnused?: boolean;
}

export class OptimalFallbackAgent {
  private page: Page;
  private cacheConfig: CacheConfig;
  private currentAgent?: PlaywrightAgent;

  // 最优回退顺序：免费优先 → 速度优先
  private models: ModelConfig[] = [
    {
      name: '阿里云 2b',
      provider: '阿里云',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: 'sk-dcfffe8f7cab48ac879df24829ac282a',
      modelName: 'qwen2-vl-2b-instruct',
      family: 'qwen3-vl',
      cost: 0.0003,
      timeout: 30000,
      description: '免费额度, 5.2秒(缓存), 100%, 加速32%'
    },
    // ⚠️ Ollama 本地模型（已注释 - CPU损耗成本高于API）
    // {
    //   name: 'Ollama 本地 4b',
    //   provider: 'Ollama',
    //   baseUrl: 'http://localhost:11434/v1',
    //   apiKey: 'ollama',
    //   modelName: 'qwen3-vl:4b',
    //   family: 'qwen3-vl',
    //   cost: 0,
    //   timeout: 60000,
    //   description: '本地, 9.5秒, 96%, Mac损耗成本高'
    // },
    {
      name: '智谱 4.6V-Flash',
      provider: '智谱',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: '0c17e7b44dc048568befbe0b40203a5e.XQF4hEsbGUDHJTi5',
      modelName: 'glm-4.6v-flash',
      family: 'glm-v',
      cost: 0,
      timeout: 30000,
      description: '免费, 7.8秒(缓存), 100%, 缓存有效'
    },
    {
      name: '智谱 4.1V-Thinking',
      provider: '智谱',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: '0c17e7b44dc048568befbe0b40203a5e.XQF4hEsbGUDHJTi5',
      modelName: 'glm-4.1v-thinking-flash',
      family: 'glm-v',
      cost: 0,
      timeout: 30000,
      description: '免费, 备选, 缓存有效'
    },
    {
      name: '阿里云 7b',
      provider: '阿里云',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: 'sk-dcfffe8f7cab48ac879df24829ac282a',
      modelName: 'qwen2-vl-7b-instruct',
      family: 'qwen3-vl',
      cost: 0.001,
      timeout: 30000,
      description: '¥0.001, 8秒, 90%'
    },
    {
      name: '阿里云 plus',
      provider: '阿里云',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: 'sk-dcfffe8f7cab48ac879df24829ac282a',
      modelName: 'qwen-vl-plus',
      family: 'qwen3-vl',
      cost: 0.008,
      timeout: 30000,
      description: '¥0.008, 3-5秒, 95%+'
    }
  ];

  // 统计信息
  private stats = {
    '阿里云2b': { success: 0, fail: 0, totalTime: 0, totalCost: 0 },
    '智谱4.6V': { success: 0, fail: 0, totalTime: 0, totalCost: 0 },
    '智谱4.1V': { success: 0, fail: 0, totalTime: 0, totalCost: 0 },
    '阿里云7b': { success: 0, fail: 0, totalTime: 0, totalCost: 0 },
    '阿里云plus': { success: 0, fail: 0, totalTime: 0, totalCost: 0 },
  };

  constructor(page: Page, options?: { cache?: CacheConfig }) {
    this.page = page;
    this.cacheConfig = options?.cache || { enabled: false };
  }

  /**
   * 刷新缓存到文件
   */
  async flushCache(options?: { cleanUnused?: boolean }): Promise<void> {
    if (this.currentAgent && this.cacheConfig.enabled) {
      await this.currentAgent.flushCache(options);
      console.log('✅ 缓存已刷新到文件');
    }
  }

  /**
   * 智能执行：按最优顺序自动回退
   */
  async smartAction(description: string): Promise<ExecutionResult> {
    console.log(`\n🤖 "${description}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (let i = 0; i < this.models.length; i++) {
      const model = this.models[i];
      const isLast = i === this.models.length - 1;

      console.log(`${i + 1}️⃣ ${model.name}...`);

      const result = await this.tryModel(model, description);

      if (result.success) {
        return result;
      }

      if (!isLast) {
        console.log(`   ❌ 失败，尝试下一个模型...`);
      } else {
        console.log(`   ❌ 所有模型都失败了`);
        throw new Error('所有模型都失败了');
      }
    }

    throw new Error('未知错误');
  }

  /**
   * 尝试使用指定模型
   */
  private async tryModel(
    model: ModelConfig,
    description: string
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      process.env.MIDSCENE_MODEL_BASE_URL = model.baseUrl;
      process.env.MIDSCENE_MODEL_API_KEY = model.apiKey;
      process.env.MIDSCENE_MODEL_NAME = model.modelName;
      process.env.MIDSCENE_MODEL_FAMILY = model.family;

      const agentOptions: any = {};
      if (this.cacheConfig.enabled) {
        const cacheId = this.cacheConfig.id || 'optimal-fallback-cache';
        agentOptions.cache = {
          id: cacheId,
          strategy: this.cacheConfig.strategy || 'read-write'
        };
      }

      const agent = new PlaywrightAgent(this.page, agentOptions);
      this.currentAgent = agent;

      await Promise.race([
        agent.aiAction(description),
        this.timeout(model.timeout)
      ]);

      const duration = Date.now() - startTime;
      const modelKey = this.getModelKey(model.name);

      this.stats[modelKey].success++;
      this.stats[modelKey].totalTime += duration;
      this.stats[modelKey].totalCost += model.cost;

      const costStr = model.cost === 0 ? '免费' : `¥${model.cost}`;
      console.log(`   ✅ 成功 (${duration}ms, ${costStr})`);

      return {
        success: true,
        model: model.name,
        duration,
        cost: model.cost
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const modelKey = this.getModelKey(model.name);

      this.stats[modelKey].fail++;

      const errorMsg = error.message || '';
      const isRateLimit = this.isRateLimitError(errorMsg);

      if (isRateLimit) {
        console.log(`   ⚠️  限流错误 (429)，立即跳过 (${duration}ms)`);
      } else {
        console.log(`   ❌ 失败: ${errorMsg.substring(0, 100)}`);
      }

      return {
        success: false,
        model: model.name,
        duration,
        cost: 0,
        error: errorMsg
      };
    }
  }

  /**
   * 检测是否为限流错误
   * 支持阿里云和智谱的限流错误格式
   */
  private isRateLimitError(errorMessage: string): boolean {
    const rateLimitPatterns = [
      '429',
      'rate limit',
      'too many requests',
      'API请求过多',
      'quota exceeded',
      '请求过于频繁'
    ];

    const lowerMsg = errorMessage.toLowerCase();
    return rateLimitPatterns.some(pattern => lowerMsg.includes(pattern.toLowerCase()));
  }

  /**
   * 超时 Promise
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`超时 ${ms}ms`)), ms);
    });
  }

  /**
   * 获取模型统计 key
   */
  private getModelKey(modelName: string): '阿里云2b' | '智谱4.6V' | '智谱4.1V' | '阿里云7b' | '阿里云plus' {
    if (modelName.includes('2b')) return '阿里云2b';
    if (modelName.includes('4.1V')) return '智谱4.1V';
    if (modelName.includes('4.6V')) return '智谱4.6V';
    if (modelName.includes('7b')) return '阿里云7b';
    return '阿里云plus';
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const total = Object.values(this.stats).reduce((sum, s) => sum + s.success, 0);
    const totalCost = Object.values(this.stats).reduce((sum, s) => sum + s.totalCost, 0);

    return {
      total,
      '阿里云2b': {
        ...this.stats['阿里云2b'],
        rate: total > 0 ? (this.stats['阿里云2b'].success / total * 100).toFixed(1) + '%' : '0%',
        avgTime: this.stats['阿里云2b'].success > 0
          ? (this.stats['阿里云2b'].totalTime / this.stats['阿里云2b'].success).toFixed(0) + 'ms'
          : '-',
      },
      '智谱4.6V': {
        ...this.stats['智谱4.6V'],
        rate: total > 0 ? (this.stats['智谱4.6V'].success / total * 100).toFixed(1) + '%' : '0%',
        avgTime: this.stats['智谱4.6V'].success > 0
          ? (this.stats['智谱4.6V'].totalTime / this.stats['智谱4.6V'].success).toFixed(0) + 'ms'
          : '-',
      },
      '智谱4.1V': {
        ...this.stats['智谱4.1V'],
        rate: total > 0 ? (this.stats['智谱4.1V'].success / total * 100).toFixed(1) + '%' : '0%',
        avgTime: this.stats['智谱4.1V'].success > 0
          ? (this.stats['智谱4.1V'].totalTime / this.stats['智谱4.1V'].success).toFixed(0) + 'ms'
          : '-',
      },
      '阿里云7b': {
        ...this.stats['阿里云7b'],
        rate: total > 0 ? (this.stats['阿里云7b'].success / total * 100).toFixed(1) + '%' : '0%',
        avgTime: this.stats['阿里云7b'].success > 0
          ? (this.stats['阿里云7b'].totalTime / this.stats['阿里云7b'].success).toFixed(0) + 'ms'
          : '-',
      },
      '阿里云plus': {
        ...this.stats['阿里云plus'],
        rate: total > 0 ? (this.stats['阿里云plus'].success / total * 100).toFixed(1) + '%' : '0%',
        avgTime: this.stats['阿里云plus'].success > 0
          ? (this.stats['阿里云plus'].totalTime / this.stats['阿里云plus'].success).toFixed(0) + 'ms'
          : '-',
      },
      totalCost: totalCost.toFixed(3),
    };
  }

  /**
   * 打印统计报告
   */
  printStats() {
    const stats = this.getStats();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 最优回退策略统计报告');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n总操作数: ${stats.total}`);
    console.log(`总成本: ¥${stats.totalCost}`);
    console.log('\n| 模型 | 成功率 | 平均耗时 | 成功/失败 | 成本 |');
    console.log('|------|--------|---------|----------|------|');
    console.log(`| 阿里云2b (免费最快) | ${stats['阿里云2b'].rate} | ${stats['阿里云2b'].avgTime} | ${stats['阿里云2b'].success}/${stats['阿里云2b'].fail} | ¥0 |`);
    console.log(`| 智谱4.6V (免费) | ${stats['智谱4.6V'].rate} | ${stats['智谱4.6V'].avgTime} | ${stats['智谱4.6V'].success}/${stats['智谱4.6V'].fail} | ¥0 |`);
    console.log(`| 智谱4.1V (免费推理) | ${stats['智谱4.1V'].rate} | ${stats['智谱4.1V'].avgTime} | ${stats['智谱4.1V'].success}/${stats['智谱4.1V'].fail} | ¥0 |`);
    console.log(`| 阿里云7b (便宜) | ${stats['阿里云7b'].rate} | ${stats['阿里云7b'].avgTime} | ${stats['阿里云7b'].success}/${stats['阿里云7b'].fail} | ¥${stats['阿里云7b'].totalCost.toFixed(3)} |`);
    console.log(`| 阿里云plus (强) | ${stats['阿里云plus'].rate} | ${stats['阿里云plus'].avgTime} | ${stats['阿里云plus'].success}/${stats['阿里云plus'].fail} | ¥${stats['阿里云plus'].totalCost.toFixed(3)} |`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const freeRate = parseFloat(stats['阿里云2b'].rate) + parseFloat(stats['智谱4.6V'].rate) + parseFloat(stats['智谱4.1V'].rate);
    if (freeRate > 70) {
      console.log('💡 结论: 免费模型表现优秀！');
      console.log(`   - ${freeRate.toFixed(1)}% 操作用免费模型完成`);
      console.log('   - 策略有效，成本极低');
    }
  }
}
