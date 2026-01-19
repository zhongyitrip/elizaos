type AgentId = 'twitter' | 'discord' | 'balance' | 'okx-market' | 'okx-trade';

type GroupId = 'social' | 'trade' | 'trade/balance' | 'trade/okx';

type AgentDefinition = {
  id: AgentId;
  name: string;
};

type GroupDefinition = {
  id: GroupId;
  name: string;
  agents: AgentDefinition[];
};

type Instance = {
  eoaAddress: string;
  createdAt: string;
  groups: GroupDefinition[];
};

type RunRecord = {
  runId: string;
  eoaAddress: string;
  groupId: GroupId;
  agentId: AgentId;
  input: unknown;
  startedAt: string;
  completedAt: string;
  output: unknown;
};

const PORT = Number(process.env.PROJECT_STARTER_MOCK_PORT || 3001);

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init?.headers || {}),
    },
  });
}

function badRequest(message: string, details?: unknown) {
  return json({ error: message, details }, { status: 400 });
}

function notFound(message: string) {
  return json({ error: message }, { status: 404 });
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEoa(eoaAddress: string) {
  return eoaAddress.trim().toLowerCase();
}

function isEoaAddress(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^0x[0-9a-fA-F]{40}$/.test(value.trim())
  );
}

function buildDefaultGroups(): GroupDefinition[] {
  return [
    {
      id: 'social',
      name: 'Social Group',
      agents: [
        { id: 'twitter', name: 'Twitter Agent' },
        { id: 'discord', name: 'Discord Agent' },
      ],
    },
    {
      id: 'trade',
      name: 'Trade Group',
      agents: [],
    },
    {
      id: 'trade/balance',
      name: 'Balance Group',
      agents: [{ id: 'balance', name: 'Balance Agent' }],
    },
    {
      id: 'trade/okx',
      name: 'OKX Group',
      agents: [
        { id: 'okx-market', name: 'OKX Market Agent' },
        { id: 'okx-trade', name: 'OKX Trade Agent' },
      ],
    },
  ];
}

const instances = new Map<string, Instance>();
const runs = new Map<string, RunRecord>();

function getAllAgentsForInstance(instance: Instance): AgentDefinition[] {
  const agents: AgentDefinition[] = [];
  for (const group of instance.groups) {
    for (const agent of group.agents) {
      agents.push(agent);
    }
  }
  return agents;
}

function hasAgent(instance: Instance, agentId: AgentId) {
  return getAllAgentsForInstance(instance).some((a) => a.id === agentId);
}

function hasGroup(instance: Instance, groupId: GroupId) {
  return instance.groups.some((g) => g.id === groupId);
}

async function readJsonBody(req: Request): Promise<unknown> {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Expected application/json');
  }
  return await req.json();
}

function simulateAgentRun(args: {
  eoaAddress: string;
  groupId: GroupId;
  agentId: AgentId;
  input: unknown;
}) {
  const startedAt = nowIso();
  const runId = crypto.randomUUID();

  const output = {
    ok: true,
    agent: {
      groupId: args.groupId,
      agentId: args.agentId,
    },
    eoaAddress: args.eoaAddress,
    receivedInput: args.input ?? null,
    simulatedAt: startedAt,
    hint:
      'This is a mock execution. Replace simulateAgentRun() with real Eliza actions / VM execution later.',
  };

  const completedAt = nowIso();
  const record: RunRecord = {
    runId,
    eoaAddress: args.eoaAddress,
    groupId: args.groupId,
    agentId: args.agentId,
    input: args.input,
    startedAt,
    completedAt,
    output,
  };

  runs.set(runId, record);
  return record;
}

function route(method: string, pathname: string) {
  return (req: Request) => req.method === method && new URL(req.url).pathname === pathname;
}

function matchPrefix(method: string, prefix: string) {
  return (req: Request) => {
    if (req.method !== method) return false;
    const path = new URL(req.url).pathname;
    return path.startsWith(prefix);
  };
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (route('GET', '/')(req)) {
      const instancesList = Array.from(instances.values());
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ELIZAOS - Project Starter Mock</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      min-height: 100vh;
    }
    .container { display: flex; height: 100vh; }
    .sidebar { 
      width: 240px; 
      background: #111; 
      border-right: 1px solid #222;
      padding: 20px;
      overflow-y: auto;
    }
    .logo { 
      font-size: 20px; 
      font-weight: 700; 
      color: #fff;
      margin-bottom: 8px;
    }
    .version { 
      font-size: 11px; 
      color: #666; 
      margin-bottom: 30px;
    }
    .create-btn {
      width: 100%;
      padding: 10px;
      background: #1a1a1a;
      border: 1px solid #333;
      color: #fff;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      margin-bottom: 20px;
    }
    .create-btn:hover { background: #222; }
    .section-title {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 20px 0 10px;
    }
    .agent-item {
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
    }
    .agent-item:hover { background: #1a1a1a; }
    .agent-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .main { flex: 1; overflow-y: auto; }
    .header {
      padding: 20px 30px;
      border-bottom: 1px solid #222;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tabs {
      display: flex;
      gap: 20px;
    }
    .tab {
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #999;
    }
    .tab.active { background: #1a1a1a; color: #fff; }
    .content { padding: 30px; }
    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .agent-card {
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .agent-card:hover {
      border-color: #667eea;
      transform: translateY(-2px);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .card-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .card-title { font-size: 16px; font-weight: 600; }
    .card-subtitle { font-size: 12px; color: #666; }
    .card-desc {
      font-size: 13px;
      color: #999;
      line-height: 1.5;
      margin-bottom: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }
    .status-online { background: #10b98133; color: #10b981; }
    .group-section {
      margin-bottom: 40px;
    }
    .group-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #fff;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    .create-form {
      max-width: 400px;
      margin: 0 auto;
      padding: 30px;
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-label {
      display: block;
      font-size: 13px;
      color: #999;
      margin-bottom: 8px;
    }
    .form-input {
      width: 100%;
      padding: 10px 12px;
      background: #0a0a0a;
      border: 1px solid #333;
      border-radius: 6px;
      color: #fff;
      font-size: 14px;
    }
    .form-input:focus {
      outline: none;
      border-color: #667eea;
    }
    .btn-primary {
      width: 100%;
      padding: 12px;
      background: #667eea;
      border: none;
      border-radius: 6px;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary:hover { background: #5568d3; }
  </style>
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <div class="logo">ELIZAOS</div>
      <div class="version">v1.7.1-beta.0 (Mock)</div>
      <button class="create-btn" onclick="showCreateForm()">+ Create New</button>
      
      <div class="section-title">Instances</div>
      ${instancesList.length === 0 ? '<div style="color:#666;font-size:12px;padding:10px 0;">No instances yet</div>' : ''}
      ${instancesList.map(inst => `
        <div class="agent-item" onclick="showInstance('${inst.eoaAddress}')">
          <div class="agent-avatar">🔑</div>
          <div>
            <div>${inst.eoaAddress.slice(0, 6)}...${inst.eoaAddress.slice(-4)}</div>
          </div>
        </div>
      `).join('')}
      
      <div class="section-title">Groups</div>
      <div class="agent-item">
        <div class="agent-avatar">👥</div>
        <div>Social</div>
      </div>
      <div class="agent-item">
        <div class="agent-avatar">💰</div>
        <div>Trade</div>
      </div>
    </div>
    
    <div class="main">
      <div class="header">
        <div class="tabs">
          <div class="tab active">Agents</div>
          <div class="tab">Groups</div>
        </div>
        <div style="font-size:12px;color:#666;">
          Instances: ${instances.size} | Runs: ${runs.size}
        </div>
      </div>
      
      <div class="content" id="content">
        ${instancesList.length === 0 ? `
          <div class="empty-state">
            <h2 style="margin-bottom:12px;">No instances yet</h2>
            <p>Create an instance with an EOA address to get started</p>
          </div>
        ` : `
          <div class="group-section">
            <div class="group-title">Social Group</div>
            <div class="agents-grid">
              <div class="agent-card">
                <div class="card-header">
                  <div class="card-avatar">🐦</div>
                  <div>
                    <div class="card-title">Twitter Agent</div>
                    <div class="card-subtitle">social/twitter</div>
                  </div>
                </div>
                <div class="card-desc">Engages with all types of questions and conversations. Provides helpful, concise responses.</div>
                <span class="status-badge status-online">● Ready</span>
              </div>
              
              <div class="agent-card">
                <div class="card-header">
                  <div class="card-avatar">💬</div>
                  <div>
                    <div class="card-title">Discord Agent</div>
                    <div class="card-subtitle">social/discord</div>
                  </div>
                </div>
                <div class="card-desc">Manages Discord community interactions and automated responses.</div>
                <span class="status-badge status-online">● Ready</span>
              </div>
            </div>
          </div>
          
          <div class="group-section">
            <div class="group-title">Trade Group</div>
            <div class="agents-grid">
              <div class="agent-card">
                <div class="card-header">
                  <div class="card-avatar">💵</div>
                  <div>
                    <div class="card-title">Balance Agent</div>
                    <div class="card-subtitle">trade/balance</div>
                  </div>
                </div>
                <div class="card-desc">Monitors wallet balances and provides real-time updates.</div>
                <span class="status-badge status-online">● Ready</span>
              </div>
              
              <div class="agent-card">
                <div class="card-header">
                  <div class="card-avatar">📊</div>
                  <div>
                    <div class="card-title">OKX Market Agent</div>
                    <div class="card-subtitle">trade/okx-market</div>
                  </div>
                </div>
                <div class="card-desc">Fetches market data and price information from OKX exchange.</div>
                <span class="status-badge status-online">● Ready</span>
              </div>
              
              <div class="agent-card">
                <div class="card-header">
                  <div class="card-avatar">💹</div>
                  <div>
                    <div class="card-title">OKX Trade Agent</div>
                    <div class="card-subtitle">trade/okx-trade</div>
                  </div>
                </div>
                <div class="card-desc">Executes trades and manages orders on OKX exchange.</div>
                <span class="status-badge status-online">● Ready</span>
              </div>
            </div>
          </div>
        `}
      </div>
    </div>
  </div>
  
  <script>
    function showCreateForm() {
      document.getElementById('content').innerHTML = \`
        <div class="create-form">
          <h2 style="margin-bottom:20px;">Create New Instance</h2>
          <form onsubmit="createInstance(event)">
            <div class="form-group">
              <label class="form-label">EOA Address</label>
              <input type="text" class="form-input" id="eoaInput" 
                     placeholder="0x..." required pattern="0x[0-9a-fA-F]{40}">
            </div>
            <button type="submit" class="btn-primary">Create Instance</button>
          </form>
        </div>
      \`;
    }
    
    async function createInstance(e) {
      e.preventDefault();
      const eoaAddress = document.getElementById('eoaInput').value;
      const res = await fetch('/instances', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({eoaAddress})
      });
      const data = await res.json();
      if (data.instance) {
        location.reload();
      }
    }
    
    function showInstance(eoa) {
      alert('Instance: ' + eoa + '\\n\\nClick on agent cards to run them!');
    }
  </script>
</body>
</html>`,
        {
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        }
      );
    }

    if (route('GET', '/demo')(req)) {
      const demoHTML = await Bun.file('./examples/project-starter-demo-ui.html').text();
      return new Response(demoHTML, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      });
    }

    if (route('GET', '/health')(req)) {
      return json({
        ok: true,
        service: 'project-starter-mock-controller',
        port: PORT,
        instanceCount: instances.size,
        runCount: runs.size,
        timestamp: nowIso(),
      });
    }

    if (route('GET', '/instances')(req)) {
      return json({
        instances: Array.from(instances.values()),
      });
    }

    if (route('POST', '/instances')(req)) {
      let body: any;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        return badRequest('Invalid JSON body', {
          message: err instanceof Error ? err.message : String(err),
        });
      }

      const eoaAddress = body?.eoaAddress;
      if (!isEoaAddress(eoaAddress)) {
        return badRequest('Invalid eoaAddress (expected 0x + 40 hex chars)', { eoaAddress });
      }

      const key = normalizeEoa(eoaAddress);
      const existing = instances.get(key);
      if (existing) {
        return json({ instance: existing, status: 'reused' });
      }

      const instance: Instance = {
        eoaAddress: key,
        createdAt: nowIso(),
        groups: buildDefaultGroups(),
      };

      instances.set(key, instance);
      return json({ instance, status: 'created' }, { status: 201 });
    }

    if (matchPrefix('GET', '/instances/')(req)) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length !== 2) {
        return notFound('Invalid instance path');
      }

      const eoaAddress = normalizeEoa(parts[1] || '');
      if (!isEoaAddress(eoaAddress)) {
        return badRequest('Invalid eoaAddress in path', { eoaAddress: parts[1] });
      }

      const instance = instances.get(eoaAddress);
      if (!instance) {
        return notFound('Instance not found');
      }

      return json({ instance });
    }

    if (matchPrefix('POST', '/instances/')(req) && url.pathname.endsWith('/run')) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length !== 3 || parts[2] !== 'run') {
        return notFound('Invalid run path');
      }

      const eoaAddress = normalizeEoa(parts[1] || '');
      if (!isEoaAddress(eoaAddress)) {
        return badRequest('Invalid eoaAddress in path', { eoaAddress: parts[1] });
      }

      const instance = instances.get(eoaAddress);
      if (!instance) {
        return notFound('Instance not found');
      }

      let body: any;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        return badRequest('Invalid JSON body', {
          message: err instanceof Error ? err.message : String(err),
        });
      }

      const groupId = body?.groupId as GroupId | undefined;
      const agentId = body?.agentId as AgentId | undefined;
      const input = body?.input;

      if (!groupId || typeof groupId !== 'string') {
        return badRequest('Missing groupId');
      }
      if (!agentId || typeof agentId !== 'string') {
        return badRequest('Missing agentId');
      }

      if (!hasGroup(instance, groupId)) {
        return badRequest('Unknown groupId for this instance', { groupId });
      }
      if (!hasAgent(instance, agentId)) {
        return badRequest('Unknown agentId for this instance', { agentId });
      }

      const record = simulateAgentRun({
        eoaAddress,
        groupId,
        agentId,
        input,
      });

      return json({
        run: record,
      });
    }

    if (matchPrefix('GET', '/runs/')(req)) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length !== 2) {
        return notFound('Invalid run path');
      }
      const runId = parts[1];
      const record = runs.get(runId);
      if (!record) {
        return notFound('Run not found');
      }
      return json({ run: record });
    }

    return notFound('Route not found');
  },
});

console.log(`[mock-controller] listening on http://localhost:${PORT}`);
