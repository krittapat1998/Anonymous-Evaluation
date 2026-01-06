#!/usr/bin/env node

/**
 * 🎫 Demo Token Generator
 * ใช้เพื่อสร้าง Token ตัวอย่างสำหรับทดสอบระบบ
 */

const crypto = require('crypto');

// === สีสำหรับ Terminal Output ===
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

// ===== ข้อมูลตัวอย่าง =====
const candidates = [
  { id: 'cand-1', name: 'John Doe', department: 'Engineering' },
  { id: 'cand-2', name: 'Jane Smith', department: 'Marketing' },
  { id: 'cand-3', name: 'Mike Johnson', department: 'Sales' },
  { id: 'cand-4', name: 'Sarah Lee', department: 'HR' },
  { id: 'cand-5', name: 'Tom Wilson', department: 'Finance' },
];

// ===== Functions =====

/**
 * สร้าง Token แบบสุ่ม
 */
function generateToken(prefix = 'token') {
  const randomPart = crypto.randomBytes(8).toString('hex').substring(0, 8);
  return `${prefix}_${randomPart}`;
}

/**
 * Hash Token (SHA-256)
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * สร้าง Voting Token สำหรับแต่ละคน
 */
function generateVotingTokens() {
  console.log(
    colorize('\n📋 VOTING TOKENS (ใช้ให้ข้อเสนอแนะแก่เพื่อน)', colors.bright + colors.cyan)
  );
  console.log(
    colorize('═'.repeat(70), colors.cyan)
  );

  const tokens = [];
  candidates.forEach((candidate, index) => {
    const token = `voter_token_${index + 1}`;
    tokens.push({
      token,
      hash: hashToken(token),
      candidate: candidate.name,
      department: candidate.department,
    });
  });

  tokens.forEach((t) => {
    console.log(
      `${colorize('Token:', colors.yellow)} ${colorize(t.token, colors.green)}`
    );
    console.log(
      `${colorize('For:', colors.yellow)} ${t.candidate} (${t.department})`
    );
    console.log(
      `${colorize('Hash:', colors.magenta)} ${t.hash.substring(0, 16)}...`
    );
    console.log();
  });

  return tokens;
}

/**
 * สร้าง Access Token สำหรับดูผล
 */
function generateAccessTokens() {
  console.log(
    colorize('\n🎟️  ACCESS TOKENS (ใช้ดูผลลัพธ์ของตัวเอง)', colors.bright + colors.cyan)
  );
  console.log(
    colorize('═'.repeat(70), colors.cyan)
  );

  const tokens = [];
  candidates.forEach((candidate) => {
    const token = `access_token_${candidate.name.split(' ')[0].toLowerCase()}`;
    tokens.push({
      token,
      hash: hashToken(token),
      candidate: candidate.name,
      department: candidate.department,
    });
  });

  tokens.forEach((t) => {
    console.log(
      `${colorize('Token:', colors.yellow)} ${colorize(t.token, colors.green)}`
    );
    console.log(
      `${colorize('For:', colors.yellow)} ${t.candidate} (${t.department})`
    );
    console.log(
      `${colorize('Hash:', colors.magenta)} ${t.hash.substring(0, 16)}...`
    );
    console.log();
  });

  return tokens;
}

/**
 * สร้าง SQL INSERT statements
 */
function generateSQLStatements(votingTokens, accessTokens) {
  console.log(
    colorize('\n💾 SQL STATEMENTS (สำหรับ PostgreSQL)', colors.bright + colors.cyan)
  );
  console.log(
    colorize('═'.repeat(70), colors.cyan)
  );
  console.log(
    colorize('\n-- 1. สร้าง Candidates พร้อม Voting Token', colors.yellow)
  );
  console.log();

  accessTokens.forEach((at, index) => {
    const candidate = candidates[index];
    const votingToken = votingTokens[index];
    const accessTokenHash = at.hash;

    console.log(`INSERT INTO candidates (id, survey_id, name, employee_id, department, access_token_hash, created_at)`);
    console.log(`VALUES (`);
    console.log(`  'cand-${index + 1}',`);
    console.log(`  'survey-1',`);
    console.log(`  '${candidate.name}',`);
    console.log(`  'EMP${(1000 + index + 1)}',`);
    console.log(`  '${candidate.department}',`);
    console.log(`  '${accessTokenHash}',`);
    console.log(`  NOW()`);
    console.log(`);`);
    console.log();
  });

  console.log(colorize('\n-- 2. ตัวอย่างการตรวจสอบ', colors.yellow));
  console.log();
  console.log('-- ตรวจสอบว่า candidates ถูกสร้างแล้ว:');
  console.log('SELECT * FROM candidates;');
  console.log();
  console.log('-- ตรวจสอบ Token Hash:');
  console.log(`SELECT name, access_token_hash FROM candidates WHERE survey_id = 'survey-1';`);
}

/**
 * สร้าง JSON Object สำหรับ Frontend Config
 */
function generateFrontendConfig(votingTokens, accessTokens) {
  console.log(
    colorize('\n⚙️  FRONTEND CONFIG (สำหรับทดสอบ)', colors.bright + colors.cyan)
  );
  console.log(
    colorize('═'.repeat(70), colors.cyan)
  );

  const config = {
    demo: {
      votingTokens: votingTokens.map((t) => t.token),
      accessTokens: accessTokens.map((t) => t.token),
      candidates: candidates.map((c) => ({ id: c.id, name: c.name })),
    },
  };

  console.log(JSON.stringify(config, null, 2));
}

/**
 * สร้าง Quick Reference Card
 */
function generateQuickReference(votingTokens, accessTokens) {
  console.log(
    colorize('\n🎯 QUICK REFERENCE (สำหรับผู้ใช้)', colors.bright + colors.cyan)
  );
  console.log(
    colorize('═'.repeat(70), colors.cyan)
  );

  console.log(colorize('\n📝 ขั้นตอน 1: ให้ข้อเสนอแนะ', colors.blue));
  console.log('1. เปิด http://localhost:5173');
  console.log('2. คลิก "Vote Now"');
  console.log(`3. ใส่ Token: ${colorize(votingTokens[0].token, colors.green)}`);
  console.log('4. เลือกเพื่อน และให้ข้อเสนอแนะ');
  console.log('5. คลิก "Submit Vote"');

  console.log(colorize('\n📊 ขั้นตอน 2: ดูผลลัพธ์', colors.blue));
  console.log('1. คลิก "View Results"');
  console.log(`2. ใส่ Token: ${colorize(accessTokens[0].token, colors.green)}`);
  console.log('3. คลิก "View Results"');
  console.log('4. ดูแผนภูมิผลลัพธ์');

  console.log(colorize('\n🔄 ทดสอบเพิ่มเติม', colors.blue));
  console.log('ใช้ Token ตัวอื่นๆ:');
  votingTokens.forEach((t, i) => {
    console.log(
      `  ${colorize(t.token, colors.green)} → ให้ข้อเสนอแนะถึง ${candidates[i].name}`
    );
  });
}

/**
 * หลัก
 */
function main() {
  console.clear();
  console.log(
    colorize('\n╔═══════════════════════════════════════════════════════════════════╗', colors.bright + colors.magenta)
  );
  console.log(
    colorize('║         🎫 Anonymous Voting System - Token Generator              ║', colors.bright + colors.magenta)
  );
  console.log(
    colorize('╚═══════════════════════════════════════════════════════════════════╝\n', colors.bright + colors.magenta)
  );

  const votingTokens = generateVotingTokens();
  const accessTokens = generateAccessTokens();
  generateSQLStatements(votingTokens, accessTokens);
  generateFrontendConfig(votingTokens, accessTokens);
  generateQuickReference(votingTokens, accessTokens);

  console.log(colorize('\n✅ Token Generation Complete!', colors.bright + colors.green));
  console.log(
    colorize('\n💡 Tips:', colors.yellow)
  );
  console.log('1. Copy SQL statements and run in PostgreSQL');
  console.log('2. Use voting tokens to test the voting page');
  console.log('3. Use access tokens to test the results page');
  console.log('4. Tokens are case-sensitive!');
  console.log('5. Each voting token can only be used once');

  console.log(
    colorize('\n📖 For more information, see:', colors.yellow)
  );
  console.log('   - USER_GUIDE_TH.md (ไทย)');
  console.log('   - USER_GUIDE_EN.md (English)');
  console.log('   - docs/API_DOCUMENTATION.md');

  console.log(colorize('\n', colors.reset));
}

// เรียกใช้
main();
