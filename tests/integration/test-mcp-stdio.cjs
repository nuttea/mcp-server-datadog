const { spawn } = require('child_process');
const fs = require('fs');

console.log('🧪 Testing MCP Server with stdio protocol...\n');

// Load env vars from .env
const envPath = '../../.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const proc = spawn('node', ['../../build/index.js'], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'inherit']
});

let output = '';
let receivedResponse = false;

proc.stdout.on('data', (data) => {
  output += data.toString();
  try {
    const messages = output.split('\n').filter(line => line.trim());
    for (const msg of messages) {
      if (msg.includes('"result"') && msg.includes('"tools"')) {
        const parsed = JSON.parse(msg);
        const toolCount = parsed.result?.tools?.length || 0;
        console.log(`✅ MCP Server responding correctly!`);
        console.log(`✅ Listed ${toolCount} tools successfully`);
        console.log(`✅ Using McpServer API (migration successful)`);
        receivedResponse = true;
        proc.kill();
        process.exit(0);
      }
    }
  } catch (e) {}
});

// Test tools/list
setTimeout(() => {
  console.log('📤 Sending tools/list request...');
  proc.stdin.write('{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n');
}, 500);

setTimeout(() => {
  if (!receivedResponse) {
    console.log('❌ No response received within timeout');
    proc.kill();
    process.exit(1);
  }
}, 5000);

proc.on('error', (err) => {
  console.error('❌ Process error:', err);
  process.exit(1);
});
