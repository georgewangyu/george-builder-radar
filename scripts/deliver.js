#!/usr/bin/env node

import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const userDir = join(homedir(), ".george-builder-radar");
const configPath = join(userDir, "config.json");
const envPath = join(userDir, ".env");

async function readInput() {
  const args = process.argv.slice(2);
  const messageIndex = args.indexOf("--message");
  if (messageIndex !== -1 && args[messageIndex + 1]) return args[messageIndex + 1];

  const fileIndex = args.indexOf("--file");
  if (fileIndex !== -1 && args[fileIndex + 1]) return await readFile(args[fileIndex + 1], "utf8");

  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function loadConfig() {
  if (!existsSync(configPath)) return {};
  return JSON.parse(await readFile(configPath, "utf8"));
}

async function loadEnvFile() {
  if (!existsSync(envPath)) return {};
  const env = {};
  const text = await readFile(envPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = value;
  }
  return env;
}

function splitTelegram(text) {
  const maxLength = 4000;
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf("\n", maxLength);
    if (splitAt < maxLength * 0.5) splitAt = maxLength;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  return chunks;
}

async function sendTelegram(text, token, chatId) {
  for (const chunk of splitTelegram(text)) {
    const body = {
      chat_id: chatId,
      text: chunk,
      parse_mode: "Markdown",
      disable_web_page_preview: true
    };

    let res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.description && err.description.includes("can't parse")) {
        delete body.parse_mode;
        res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Telegram API error: ${err.description || res.statusText}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function sendEmail(text, apiKey, toEmail) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: "George's Builder Radar <digest@resend.dev>",
      to: [toEmail],
      subject: `George's Builder Radar - ${new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      })}`,
      text
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend API error: ${err.message || JSON.stringify(err)}`);
  }
}

const config = await loadConfig();
const env = { ...(await loadEnvFile()), ...process.env };
const delivery = config.delivery || { method: "stdout" };
const text = await readInput();

if (!text.trim()) {
  console.log(JSON.stringify({ status: "skipped", reason: "Empty digest text" }));
  process.exit(0);
}

try {
  if (delivery.method === "telegram") {
    if (!env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not found in ~/.george-builder-radar/.env");
    if (!delivery.chatId) throw new Error("delivery.chatId not found in ~/.george-builder-radar/config.json");
    await sendTelegram(text, env.TELEGRAM_BOT_TOKEN, delivery.chatId);
    console.log(JSON.stringify({ status: "ok", method: "telegram" }));
  } else if (delivery.method === "email") {
    if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not found in ~/.george-builder-radar/.env");
    if (!delivery.email) throw new Error("delivery.email not found in ~/.george-builder-radar/config.json");
    await sendEmail(text, env.RESEND_API_KEY, delivery.email);
    console.log(JSON.stringify({ status: "ok", method: "email" }));
  } else {
    console.log(text);
  }
} catch (error) {
  console.log(JSON.stringify({ status: "error", method: delivery.method, message: error.message }));
  process.exit(1);
}
