const fs = require('fs');
const path = require('path');
const os = require('os');

const [,, prompt, outPath, model = 'gpt-image-2.6-sunburst', size = '1024x1792'] = process.argv;

if (!prompt || !outPath) {
  console.error('Usage: node tools/genimg.cjs "<prompt>" <out.png> [model] [size]');
  process.exit(1);
}

// 1. 读取 A6_API_KEY
const credPath = path.join(os.homedir(), '.dsh', '.credentials.yaml');
if (!fs.existsSync(credPath)) {
  console.error(`Credentials file not found: ${credPath}`);
  process.exit(1);
}

const credContent = fs.readFileSync(credPath, 'utf8');
const match = credContent.match(/A6_API_KEY:\s*([^\r\n"']+)/);
if (!match || !match[1].trim()) {
  console.error('A6_API_KEY not found in credentials file');
  process.exit(1);
}
const apiKey = match[1].trim();

async function main() {
  console.log(`[genimg] Model: ${model}, Size: ${size}`);
  console.log(`[genimg] Prompt: ${prompt.slice(0, 100)}...`);

  const reqBody = {
    model,
    prompt,
    n: 1,
    size
  };

  const resp = await fetch('https://a6api.vip/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reqBody)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[genimg] HTTP ${resp.status}: ${errText.slice(0, 500)}`);
    process.exit(1);
  }

  const data = await resp.json();
  const item = data.data && data.data[0];
  if (!item) {
    console.error('[genimg] No image data returned:', JSON.stringify(data).slice(0, 300));
    process.exit(1);
  }

  // 确保目录存在
  const resolvedOut = path.resolve(outPath);
  fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });

  if (item.b64_json) {
    fs.writeFileSync(resolvedOut, Buffer.from(item.b64_json, 'base64'));
    console.log(`[genimg] Saved (base64): ${resolvedOut} (${fs.statSync(resolvedOut).size} bytes)`);
  } else if (item.url) {
    console.log(`[genimg] Downloading from URL...`);
    const imgResp = await fetch(item.url);
    if (!imgResp.ok) {
      console.error(`[genimg] Failed to download URL: ${imgResp.status}`);
      process.exit(1);
    }
    const buf = Buffer.from(await imgResp.arrayBuffer());
    fs.writeFileSync(resolvedOut, buf);
    console.log(`[genimg] Saved (url): ${resolvedOut} (${buf.length} bytes)`);
  }
}

main().catch(err => {
  console.error('[genimg] Error:', err);
  process.exit(1);
});
