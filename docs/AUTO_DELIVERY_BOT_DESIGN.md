# 人生K线 - 自动发货机器人设计文档

## 1. 概述

### 1.1 需求背景

卖家在多个电商平台（淘宝、咸鱼、小红书等）销售"人生K线"服务，用户付款后需要自动发送账号密码。本机器人负责：

1. 监听各平台订单
2. 自动从账号池分配账号
3. 向买家发送账号信息
4. 记录发货日志

### 1.2 设计目标

| 目标 | 说明 |
|------|------|
| 跨平台 | 统一架构支持多电商平台 |
| 自动化 | 24小时无人值守运行 |
| 可靠性 | 发货失败自动重试、告警 |
| 可追溯 | 完整的发货日志 |
| 易扩展 | 新增平台只需实现适配器 |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          自动发货系统                                    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         核心服务层                                  │ │
│  │                                                                      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │ │
│  │  │  账号池管理  │  │  订单队列   │  │  发货引擎   │  │  通知服务  │ │ │
│  │  │AccountPool │  │ OrderQueue │  │DeliveryEngine│  │ Notifier  │ │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │ │
│  │         │                │                │               │        │ │
│  │         └────────────────┴────────┬───────┴───────────────┘        │ │
│  └──────────────────────────────────┼─────────────────────────────────┘ │
│                                     │                                    │
│  ┌──────────────────────────────────┼────────────────────────────────┐  │
│  │                         平台适配层                                 │  │
│  │                                  │                                 │  │
│  │    ┌─────────────────────────────┼─────────────────────────────┐  │  │
│  │    │                             │                             │  │  │
│  │    ▼                             ▼                             ▼  │  │
│  │ ┌──────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │  │
│  │ │ TaobaoAdapter│  │  XianyuAdapter       │  │XiaohongshuAdapter│  │  │
│  │ │   淘宝适配器  │  │   咸鱼适配器         │  │  小红书适配器    │  │  │
│  │ └──────┬───────┘  └──────────┬───────────┘  └────────┬────────┘  │  │
│  └────────┼─────────────────────┼───────────────────────┼───────────┘  │
│           │                     │                       │              │
└───────────┼─────────────────────┼───────────────────────┼──────────────┘
            │                     │                       │
            ▼                     ▼                       ▼
     ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
     │   淘宝平台    │  │    咸鱼平台       │  │   小红书平台     │
     │   千牛/API   │  │  闲鱼开放平台     │  │   专业号后台     │
     └──────────────┘  └──────────────────┘  └──────────────────┘
```

### 2.2 技术选型

| 组件 | 技术 | 说明 |
|------|------|------|
| 运行时 | Node.js / Python | 异步IO，适合爬虫/自动化 |
| 消息队列 | Redis / RabbitMQ | 订单队列、重试队列 |
| 数据库 | MySQL / SQLite | 存储账号池、发货记录 |
| 浏览器自动化 | Puppeteer / Playwright | 模拟登录、消息发送 |
| 定时任务 | node-cron / APScheduler | 定期检查订单 |
| 告警 | 钉钉/飞书/Telegram Bot | 异常通知管理员 |

---

## 3. 核心模块设计

### 3.1 统一适配器接口

```typescript
/**
 * 电商平台适配器接口
 * 所有平台必须实现此接口
 */
interface IPlatformAdapter {
  /** 平台名称 */
  readonly name: string;
  
  /** 平台标识 */
  readonly platformId: 'taobao' | 'xianyu' | 'xiaohongshu' | 'pdd';
  
  /**
   * 初始化适配器（登录等）
   */
  initialize(): Promise<void>;
  
  /**
   * 获取待发货订单列表
   */
  fetchPendingOrders(): Promise<Order[]>;
  
  /**
   * 发送消息给买家
   * @param order 订单信息
   * @param message 消息内容
   * @returns 是否发送成功
   */
  sendMessage(order: Order, message: string): Promise<DeliveryResult>;
  
  /**
   * 标记订单为已发货
   */
  markAsDelivered(orderId: string): Promise<boolean>;
  
  /**
   * 检查适配器健康状态
   */
  healthCheck(): Promise<boolean>;
  
  /**
   * 清理资源
   */
  cleanup(): Promise<void>;
}

/**
 * 订单数据结构
 */
interface Order {
  orderId: string;          // 平台订单号
  platform: string;         // 平台标识
  buyerId: string;          // 买家ID
  buyerNickname: string;    // 买家昵称
  productId: string;        // 商品ID
  productName: string;      // 商品名称
  quantity: number;         // 数量
  amount: number;           // 金额
  paidAt: Date;             // 付款时间
  status: OrderStatus;      // 订单状态
  extra?: Record<string, any>;
}

/**
 * 发货结果
 */
interface DeliveryResult {
  success: boolean;
  messageId?: string;       // 消息ID
  error?: string;           // 错误信息
  retryable?: boolean;      // 是否可重试
}
```

### 3.2 账号池管理器

```typescript
class AccountPoolManager {
  /**
   * 获取一个可用账号
   * @param orderId 关联订单号
   * @param platform 来源平台
   */
  async allocate(orderId: string, platform: string): Promise<Account | null> {
    // 1. 查询 status='unused' 的账号
    // 2. 使用事务锁定
    // 3. 更新 status='active', order_id, platform
    // 4. 返回账号信息
  }
  
  /**
   * 回收账号（订单取消/退款时）
   */
  async recycle(orderId: string): Promise<boolean> {
    // 1. 查询该订单关联的账号
    // 2. 如果 first_login_at 为空（未使用），重置为 unused
    // 3. 清除 order_id, platform
  }
  
  /**
   * 获取账号池状态
   */
  async getPoolStatus(): Promise<PoolStatus> {
    return {
      total: await this.countAll(),
      unused: await this.countByStatus('unused'),
      active: await this.countByStatus('active'),
      expired: await this.countByStatus('expired'),
    };
  }
  
  /**
   * 批量生成账号
   */
  async generateBatch(count: number, usesPerAccount: number): Promise<Account[]> {
    const accounts: Account[] = [];
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    for (let i = 0; i < count; i++) {
      const seq = String(await this.getNextSequence()).padStart(5, '0');
      const username = `LK${date}${seq}`;
      const password = this.generatePassword();
      
      accounts.push({
        id: uuid(),
        username,
        password,
        passwordHash: await bcrypt.hash(password, 10),
        remainingUses: usesPerAccount,
        status: 'unused',
      });
    }
    
    await this.batchInsert(accounts);
    return accounts;
  }
  
  private generatePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const length = 8 + Math.floor(Math.random() * 4); // 8-11位
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
```

### 3.3 发货引擎

```typescript
class DeliveryEngine {
  private adapters: Map<string, IPlatformAdapter> = new Map();
  private accountPool: AccountPoolManager;
  private notifier: Notifier;
  
  /**
   * 注册平台适配器
   */
  registerAdapter(adapter: IPlatformAdapter): void {
    this.adapters.set(adapter.platformId, adapter);
  }
  
  /**
   * 处理单个订单
   */
  async processOrder(order: Order): Promise<void> {
    const adapter = this.adapters.get(order.platform);
    if (!adapter) {
      throw new Error(`未找到平台适配器: ${order.platform}`);
    }
    
    // 1. 分配账号
    const account = await this.accountPool.allocate(order.orderId, order.platform);
    if (!account) {
      await this.notifier.alert('账号池已耗尽！请及时补充');
      throw new Error('账号池已耗尽');
    }
    
    // 2. 生成发货消息
    const message = this.buildDeliveryMessage(account, order);
    
    // 3. 发送消息
    const result = await this.sendWithRetry(adapter, order, message);
    
    // 4. 记录日志
    await this.logDelivery(order, account, result);
    
    // 5. 标记已发货
    if (result.success) {
      await adapter.markAsDelivered(order.orderId);
    }
  }
  
  /**
   * 带重试的发送
   */
  private async sendWithRetry(
    adapter: IPlatformAdapter,
    order: Order,
    message: string,
    maxRetries: number = 3
  ): Promise<DeliveryResult> {
    let lastError: string | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await adapter.sendMessage(order, message);
        if (result.success) return result;
        
        lastError = result.error;
        if (!result.retryable) break;
        
        // 指数退避
        await this.delay(Math.pow(2, attempt) * 1000);
      } catch (error: any) {
        lastError = error.message;
      }
    }
    
    return { success: false, error: lastError, retryable: false };
  }
  
  /**
   * 构建发货消息
   */
  private buildDeliveryMessage(account: Account, order: Order): string {
    return `
【人生K线 - 账号发货成功】

您的专属账号已生成 ✨

🔐 登录信息：
账号：${account.username}
密码：${account.password}

📊 使用次数：${account.remainingUses}次

🌐 使用地址：https://lifekline.com

📝 使用说明：
1. 访问上方网址
2. 点击"登录"输入账号密码
3. 开始生成您的人生K线图

⚠️ 注意事项：
- 账号仅限本人使用
- 生成次数用完后可续购
- 如有问题请联系客服

祝您使用愉快！
    `.trim();
  }
}
```

---

## 4. 平台适配器实现

### 4.1 淘宝/天猫适配器

#### 方案选择

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|-------|
| **淘宝开放平台 API** | 官方支持，稳定 | 需企业资质审核 | ⭐⭐⭐⭐⭐ |
| **千牛消息接口** | 商家必备工具 | 需要付费版本 | ⭐⭐⭐⭐ |
| **浏览器自动化** | 无需审核 | 不稳定，易被风控 | ⭐⭐ |

#### 淘宝开放平台实现

```typescript
class TaobaoAdapter implements IPlatformAdapter {
  name = '淘宝/天猫';
  platformId = 'taobao' as const;
  
  private client: TaobaoClient;
  private accessToken: string;
  
  async initialize(): Promise<void> {
    // OAuth2 授权获取 access_token
    this.client = new TaobaoClient({
      appKey: process.env.TAOBAO_APP_KEY,
      appSecret: process.env.TAOBAO_APP_SECRET,
    });
    this.accessToken = await this.refreshToken();
  }
  
  async fetchPendingOrders(): Promise<Order[]> {
    // 调用 taobao.trades.sold.get 接口
    const response = await this.client.execute('taobao.trades.sold.get', {
      fields: 'tid,buyer_nick,payment,status,pay_time',
      status: 'WAIT_SELLER_SEND_GOODS', // 待发货
    }, this.accessToken);
    
    return response.trades.map(this.mapToOrder);
  }
  
  async sendMessage(order: Order, message: string): Promise<DeliveryResult> {
    try {
      // 调用 taobao.wangwang.eservice.chatlog.write 发送消息
      // 或使用交易备注 taobao.trade.memo.add
      await this.client.execute('taobao.trade.memo.add', {
        tid: order.orderId,
        memo: message,
        flag: 1, // 红旗标记
      }, this.accessToken);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message, retryable: true };
    }
  }
  
  async markAsDelivered(orderId: string): Promise<boolean> {
    // 虚拟商品自动发货
    await this.client.execute('taobao.logistics.dummy.send', {
      tid: orderId,
      feature: 'nocheck=true',
    }, this.accessToken);
    return true;
  }
}
```

### 4.2 咸鱼适配器

#### 方案说明

咸鱼暂无官方开放平台，主要通过以下方式实现：

| 方案 | 实现难度 | 稳定性 |
|------|---------|-------|
| **闲鱼自动回复机器人** | 低 | 中 |
| **浏览器自动化（Playwright）** | 中 | 低 |
| **APP 抓包 + 模拟请求** | 高 | 不推荐 |

#### 浏览器自动化实现

```typescript
class XianyuAdapter implements IPlatformAdapter {
  name = '咸鱼';
  platformId = 'xianyu' as const;
  
  private browser: Browser;
  private page: Page;
  
  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    
    // 加载已保存的登录状态
    const cookies = await this.loadCookies();
    if (cookies) {
      await this.page.context().addCookies(cookies);
    }
    
    // 访问咸鱼
    await this.page.goto('https://www.goofish.com/');
    
    // 检查登录状态，必要时手动登录
    if (!(await this.isLoggedIn())) {
      console.log('请在浏览器中手动登录咸鱼...');
      await this.waitForLogin();
      await this.saveCookies();
    }
  }
  
  async fetchPendingOrders(): Promise<Order[]> {
    // 导航到"我卖出的"页面
    await this.page.goto('https://www.goofish.com/personal?tabKey=sold');
    
    // 等待订单列表加载
    await this.page.waitForSelector('.order-list');
    
    // 提取待发货订单
    const orders = await this.page.evaluate(() => {
      const items = document.querySelectorAll('.order-item[data-status="待发货"]');
      return Array.from(items).map(item => ({
        orderId: item.getAttribute('data-order-id'),
        buyerNickname: item.querySelector('.buyer-name')?.textContent,
        // ... 其他字段
      }));
    });
    
    return orders.map(this.mapToOrder);
  }
  
  async sendMessage(order: Order, message: string): Promise<DeliveryResult> {
    try {
      // 进入聊天页面
      await this.page.goto(`https://www.goofish.com/im?targetId=${order.buyerId}`);
      
      // 等待输入框
      await this.page.waitForSelector('.chat-input');
      
      // 输入消息
      await this.page.fill('.chat-input', message);
      
      // 发送
      await this.page.click('.send-button');
      
      // 等待发送成功
      await this.page.waitForSelector('.message-sent-success');
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message, retryable: true };
    }
  }
}
```

### 4.3 小红书适配器

#### 方案说明

小红书商家后台提供了一定的 API 能力：

| 方案 | 说明 |
|------|------|
| **小红书开放平台** | 需要成为入驻商家 |
| **专业号后台自动化** | 使用 Playwright |

#### 实现示例

```typescript
class XiaohongshuAdapter implements IPlatformAdapter {
  name = '小红书';
  platformId = 'xiaohongshu' as const;
  
  private browser: Browser;
  private page: Page;
  
  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    
    // 加载商家后台
    await this.page.goto('https://ark.xiaohongshu.com/');
    
    // 登录流程（支持扫码）
    if (!(await this.isLoggedIn())) {
      console.log('请扫码登录小红书商家后台...');
      await this.waitForLogin();
    }
  }
  
  async fetchPendingOrders(): Promise<Order[]> {
    // 进入订单管理页面
    await this.page.goto('https://ark.xiaohongshu.com/order/list?status=待发货');
    
    // 提取订单列表
    // ...
  }
  
  async sendMessage(order: Order, message: string): Promise<DeliveryResult> {
    // 通过私信发送
    // 或通过订单备注
    // ...
  }
}
```

---

## 5. 工作流程

### 5.1 主循环流程

```
┌─────────────────────────────────────────────────────────────┐
│                       主循环                                 │
│                                                              │
│   ┌───────────┐                                             │
│   │  启动系统  │                                             │
│   └─────┬─────┘                                             │
│         │                                                    │
│         ▼                                                    │
│   ┌───────────────────────────────────────────────────────┐ │
│   │              初始化所有平台适配器                       │ │
│   │  - 淘宝: OAuth授权                                     │ │
│   │  - 咸鱼: 加载Cookies/扫码登录                          │ │
│   │  - 小红书: 加载Cookies/扫码登录                        │ │
│   └───────────────────────────────────────────────────────┘ │
│         │                                                    │
│         ▼                                                    │
│   ┌───────────┐  每60秒循环  ┌───────────────────────────┐ │
│   │  定时任务  │◀────────────│  并行拉取各平台待发货订单  │ │
│   └─────┬─────┘              └───────────────────────────┘ │
│         │                                                    │
│         ▼                                                    │
│   ┌───────────────────────────────────────────────────────┐ │
│   │                 订单去重 & 入队列                       │ │
│   └───────────────────────────────────────────────────────┘ │
│         │                                                    │
│         ▼                                                    │
│   ┌───────────────────────────────────────────────────────┐ │
│   │              从队列取出订单，逐个处理                   │ │
│   │                                                         │ │
│   │   For each order:                                       │ │
│   │     1. 分配账号                                         │ │
│   │     2. 发送消息                                         │ │
│   │     3. 标记发货                                         │ │
│   │     4. 记录日志                                         │ │
│   └───────────────────────────────────────────────────────┘ │
│         │                                                    │
│         ▼                                                    │
│   ┌───────────────────────────────────────────────────────┐ │
│   │                   异常处理 & 告警                       │ │
│   │                                                         │ │
│   │   - 发送失败 → 重试队列（最多3次）                      │ │
│   │   - 账号池不足 → 钉钉/飞书告警                          │ │
│   │   - 适配器异常 → 记录并跳过                             │ │
│   └───────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 发货流程详解

```typescript
async function deliveryWorkflow(order: Order): Promise<void> {
  const startTime = Date.now();
  let deliveryLog: DeliveryLog = {
    orderId: order.orderId,
    platform: order.platform,
    buyerId: order.buyerId,
    startTime: new Date(),
    status: 'processing',
  };
  
  try {
    // Step 1: 检查是否已发货（防重复）
    if (await isAlreadyDelivered(order.orderId)) {
      console.log(`订单 ${order.orderId} 已发货，跳过`);
      return;
    }
    
    // Step 2: 分配账号
    const account = await accountPool.allocate(order.orderId, order.platform);
    if (!account) {
      deliveryLog.status = 'failed';
      deliveryLog.error = '账号池已耗尽';
      await notifier.alert('⚠️ 账号池已耗尽，请立即补充！');
      throw new Error('账号池已耗尽');
    }
    deliveryLog.accountId = account.id;
    deliveryLog.accountUsername = account.username;
    
    // Step 3: 生成发货消息
    const message = buildDeliveryMessage(account, order);
    
    // Step 4: 发送消息（带重试）
    const adapter = getAdapter(order.platform);
    const result = await sendWithRetry(adapter, order, message);
    
    if (!result.success) {
      deliveryLog.status = 'failed';
      deliveryLog.error = result.error;
      
      // 发送失败，回收账号
      await accountPool.recycle(order.orderId);
      
      // 加入重试队列
      if (result.retryable) {
        await retryQueue.push(order);
      }
      
      throw new Error(`发送失败: ${result.error}`);
    }
    
    // Step 5: 标记订单已发货
    await adapter.markAsDelivered(order.orderId);
    
    // Step 6: 记录成功
    deliveryLog.status = 'success';
    deliveryLog.messageId = result.messageId;
    deliveryLog.duration = Date.now() - startTime;
    
    console.log(`✅ 订单 ${order.orderId} 发货成功`);
    
  } catch (error: any) {
    deliveryLog.error = error.message;
    throw error;
  } finally {
    deliveryLog.endTime = new Date();
    await saveDeliveryLog(deliveryLog);
  }
}
```

---

## 6. 数据存储

### 6.1 发货记录表

```sql
CREATE TABLE delivery_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 订单信息
    order_id        VARCHAR(64) NOT NULL,
    platform        VARCHAR(32) NOT NULL,
    buyer_id        VARCHAR(64),
    buyer_nickname  VARCHAR(64),
    product_name    VARCHAR(256),
    amount          DECIMAL(10, 2),
    
    -- 账号信息
    account_id      VARCHAR(36),
    account_username VARCHAR(32),
    
    -- 发货状态
    status          ENUM('processing', 'success', 'failed', 'retrying') NOT NULL,
    error_message   TEXT,
    retry_count     INT DEFAULT 0,
    message_id      VARCHAR(64),           -- 平台返回的消息ID
    
    -- 时间
    order_paid_at   TIMESTAMP,             -- 订单付款时间
    started_at      TIMESTAMP,             -- 开始处理时间
    completed_at    TIMESTAMP,             -- 完成时间
    duration_ms     INT,                   -- 处理耗时
    
    -- 索引
    INDEX idx_order (order_id),
    INDEX idx_platform (platform),
    INDEX idx_status (status),
    INDEX idx_account (account_id),
    INDEX idx_completed (completed_at)
);
```

### 6.2 重试队列

使用 Redis 实现：

```typescript
// 重试队列 Key
const RETRY_QUEUE_KEY = 'delivery:retry:queue';
const RETRY_DELAY_KEY = 'delivery:retry:delay';

// 加入重试队列
async function pushToRetryQueue(order: Order): Promise<void> {
  const retryCount = await getRetryCount(order.orderId);
  if (retryCount >= 3) {
    console.log(`订单 ${order.orderId} 重试次数已达上限，放弃`);
    return;
  }
  
  // 指数退避延迟
  const delay = Math.pow(2, retryCount + 1) * 60 * 1000; // 2分钟, 4分钟, 8分钟
  const executeAt = Date.now() + delay;
  
  await redis.zadd(RETRY_QUEUE_KEY, executeAt, JSON.stringify(order));
  await redis.incr(`${RETRY_DELAY_KEY}:${order.orderId}`);
}

// 处理重试队列
async function processRetryQueue(): Promise<void> {
  const now = Date.now();
  const items = await redis.zrangebyscore(RETRY_QUEUE_KEY, 0, now);
  
  for (const item of items) {
    const order = JSON.parse(item);
    await deliveryWorkflow(order);
    await redis.zrem(RETRY_QUEUE_KEY, item);
  }
}
```

---

## 7. 监控与告警

### 7.1 监控指标

| 指标 | 说明 | 告警阈值 |
|------|------|---------|
| `delivery_success_rate` | 发货成功率 | < 95% |
| `account_pool_remaining` | 剩余账号数 | < 50 |
| `avg_delivery_time` | 平均发货耗时 | > 5分钟 |
| `retry_queue_size` | 重试队列大小 | > 100 |
| `adapter_health` | 适配器健康状态 | 任一离线 |

### 7.2 告警通知

```typescript
class Notifier {
  private dingTalkWebhook: string;
  private feishuWebhook: string;
  private telegramBotToken: string;
  private telegramChatId: string;
  
  async alert(message: string, level: 'info' | 'warning' | 'error' = 'warning'): Promise<void> {
    const formattedMessage = `
[${level.toUpperCase()}] 人生K线发货机器人

${message}

时间: ${new Date().toLocaleString('zh-CN')}
    `.trim();
    
    // 并行发送到所有渠道
    await Promise.allSettled([
      this.sendDingTalk(formattedMessage),
      this.sendFeishu(formattedMessage),
      this.sendTelegram(formattedMessage),
    ]);
  }
  
  private async sendDingTalk(message: string): Promise<void> {
    await fetch(this.dingTalkWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgtype: 'text',
        text: { content: message },
      }),
    });
  }
  
  // ... 其他渠道实现
}
```

### 7.3 日报统计

```typescript
async function generateDailyReport(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  
  const stats = await db.query(`
    SELECT 
      platform,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      AVG(duration_ms) as avg_duration
    FROM delivery_logs
    WHERE DATE(completed_at) = ?
    GROUP BY platform
  `, [today]);
  
  const poolStatus = await accountPool.getPoolStatus();
  
  return `
📊 人生K线发货日报 (${today})

【发货统计】
${stats.map(s => `
${s.platform}: 
  - 总计: ${s.total} 单
  - 成功: ${s.success} 单 (${(s.success/s.total*100).toFixed(1)}%)
  - 失败: ${s.failed} 单
  - 平均耗时: ${(s.avg_duration/1000).toFixed(1)}s
`).join('\n')}

【账号池状态】
- 总账号: ${poolStatus.total}
- 未使用: ${poolStatus.unused}
- 已激活: ${poolStatus.active}
- 已过期: ${poolStatus.expired}

${poolStatus.unused < 100 ? '⚠️ 账号池不足100，请及时补充！' : '✅ 账号池充足'}
  `.trim();
}
```

---

## 8. 部署方案

### 8.1 运行环境

```yaml
# docker-compose.yml
version: '3.8'

services:
  delivery-bot:
    build: .
    environment:
      - DATABASE_URL=mysql://user:pass@db:3306/lifekline
      - REDIS_URL=redis://redis:6379
      - TAOBAO_APP_KEY=${TAOBAO_APP_KEY}
      - TAOBAO_APP_SECRET=${TAOBAO_APP_SECRET}
      - DINGTALK_WEBHOOK=${DINGTALK_WEBHOOK}
    volumes:
      - ./data:/app/data  # 存储 cookies 等
    depends_on:
      - db
      - redis
    restart: unless-stopped
    
  db:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=lifekline
      
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

### 8.2 配置文件

```typescript
// config.ts
export const config = {
  // 轮询间隔（毫秒）
  pollInterval: 60 * 1000,
  
  // 发货消息模板
  messageTemplate: `
【人生K线 - 账号发货成功】

您的专属账号已生成 ✨

🔐 登录信息：
账号：{{username}}
密码：{{password}}

📊 使用次数：{{uses}}次

🌐 使用地址：https://lifekline.com
  `,
  
  // 重试配置
  retry: {
    maxAttempts: 3,
    baseDelay: 2 * 60 * 1000, // 2分钟
  },
  
  // 告警配置
  alert: {
    accountPoolThreshold: 50,
    successRateThreshold: 0.95,
  },
  
  // 平台配置
  platforms: {
    taobao: {
      enabled: true,
      appKey: process.env.TAOBAO_APP_KEY,
      appSecret: process.env.TAOBAO_APP_SECRET,
    },
    xianyu: {
      enabled: true,
      cookiePath: './data/xianyu-cookies.json',
    },
    xiaohongshu: {
      enabled: false, // 按需开启
      cookiePath: './data/xhs-cookies.json',
    },
  },
};
```

---

## 9. 实施计划

### Phase 1: 核心框架（1周）

- [ ] 搭建项目结构
- [ ] 实现账号池管理器
- [ ] 实现发货引擎
- [ ] 数据库表创建

### Phase 2: 淘宝适配器（1周）

- [ ] 对接淘宝开放平台
- [ ] 实现订单拉取
- [ ] 实现消息发送
- [ ] 测试完整流程

### Phase 3: 咸鱼适配器（1周）

- [ ] 实现浏览器自动化
- [ ] Cookie 持久化
- [ ] 消息发送适配
- [ ] 异常处理

### Phase 4: 监控告警（3天）

- [ ] 对接钉钉/飞书
- [ ] 实现日报功能
- [ ] 异常告警

### Phase 5: 部署上线（2天）

- [ ] Docker 容器化
- [ ] 部署到服务器
- [ ] 运维文档

---

## 10. 附录

### 10.1 常见问题

**Q: 浏览器自动化会被平台检测吗？**

A: 有可能。建议：
1. 使用真实浏览器指纹
2. 模拟人类操作（随机延迟）
3. 不要频繁操作
4. 优先使用官方 API

**Q: 账号池不足怎么办？**

A: 
1. 设置告警阈值（如 < 100 个）
2. 提前批量生成账号
3. 日报中提醒补充

**Q: 订单取消/退款如何处理？**

A: 
1. 定期检查已发货订单状态
2. 发现退款，调用 `accountPool.recycle(orderId)`
3. 如果账号未使用，重新入池

### 10.2 API 参考

- [淘宝开放平台](https://open.taobao.com/)
- [小红书开放平台](https://open.xiaohongshu.com/)
- [Playwright 文档](https://playwright.dev/)
