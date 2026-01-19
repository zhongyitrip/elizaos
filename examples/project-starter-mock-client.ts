const BASE_URL = process.env.PROJECT_STARTER_MOCK_BASE_URL || 'http://localhost:3001';

async function main() {
  const eoaAddress = process.env.EOA_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

  const createRes = await fetch(`${BASE_URL}/instances`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ eoaAddress }),
  });

  const created = await createRes.json();
  console.log('Create instance:', created.status);
  console.log(created.instance);

  const runRes = await fetch(`${BASE_URL}/instances/${eoaAddress}/run`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      groupId: 'social',
      agentId: 'twitter',
      input: {
        prompt: 'Post a tweet saying hello (mock)',
      },
    }),
  });

  const run = await runRes.json();
  console.log('Run agent:');
  console.log(run.run);

  const getRunRes = await fetch(`${BASE_URL}/runs/${run.run.runId}`);
  const fetched = await getRunRes.json();
  console.log('Fetch run:');
  console.log(fetched.run);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
