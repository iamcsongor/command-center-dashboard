import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface TranscriptResult {
  meeting_title: string;
  summary: string;
  action_items: { title: string; priority: "low" | "medium" | "high" }[];
  key_decisions: string[];
  follow_ups: string[];
}

async function analyzeTranscript(
  filename: string,
  content: string
): Promise<TranscriptResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Analyze this meeting transcript and extract structured information. Return ONLY valid JSON with no markdown formatting.

Filename: ${filename}

Transcript:
${content.slice(0, 12000)}

Return this exact JSON structure:
{
  "meeting_title": "A concise title for this meeting",
  "summary": "2-3 sentence summary of the meeting",
  "action_items": [{"title": "Clear actionable task", "priority": "high|medium|low"}],
  "key_decisions": ["Decision that was made"],
  "follow_ups": ["Item that needs follow up"]
}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "{}";
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

async function sendSlackDigest(
  results: { filename: string; analysis: TranscriptResult }[]
) {
  const totalActions = results.reduce(
    (sum, r) => sum + r.analysis.action_items.length,
    0
  );
  const totalDecisions = results.reduce(
    (sum, r) => sum + r.analysis.key_decisions.length,
    0
  );
  const totalFollowUps = results.reduce(
    (sum, r) => sum + r.analysis.follow_ups.length,
    0
  );

  const blocks: object[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `ð Daily Meeting Digest â ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*ð Meetings*\n${results.length}` },
        { type: "mrkdwn", text: `*â Action Items*\n${totalActions}` },
        { type: "mrkdwn", text: `*ð¯ Decisions*\n${totalDecisions}` },
        { type: "mrkdwn", text: `*ð Follow-ups*\n${totalFollowUps}` },
      ],
    },
    { type: "divider" },
  ];

  for (const result of results) {
    const { analysis } = result;
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*ðï¸ ${analysis.meeting_title}*\n${analysis.summary}`,
      },
    });

    if (analysis.action_items.length > 0) {
      const priorityEmoji: Record<string, string> = {
        high: "ð´",
        medium: "ð¡",
        low: "ð¢",
      };
      const items = analysis.action_items
        .map((a) => `${priorityEmoji[a.priority] || "âª"} ${a.title}`)
        .join("\n");
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `*Action Items:*\n${items}` },
      });
    }

    if (analysis.key_decisions.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Decisions:*\n${analysis.key_decisions.map((d) => `â¢ ${d}`).join("\n")}`,
        },
      });
    }

    if (analysis.follow_ups.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Follow-ups:*\n${analysis.follow_ups.map((f) => `â³ ${f}`).join("\n")}`,
        },
      });
    }

    blocks.push({ type: "divider" });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `â¡ Auto-created ${totalActions} task${totalActions !== 1 ? "s" : ""} in your dashboard â¢ Processed at ${new Date().toLocaleTimeString("en-US", { timeZone: "Europe/Budapest", hour: "2-digit", minute: "2-digit" })} CET`,
      },
    ],
  });

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  try {
    const body = await request.json();
    const transcripts: { filename: string; content: string }[] =
      body.transcripts || [];

    if (transcripts.length === 0) {
      return NextResponse.json({
        message: "No new transcripts to process",
        processed: 0,
      });
    }

    const results: { filename: string; analysis: TranscriptResult }[] = [];

    for (const transcript of transcripts) {
      const { data: existing } = await supabase
        .from("processed_files")
        .select("id")
        .eq("filename", transcript.filename)
        .single();

      if (existing) continue;

      const analysis = await analyzeTranscript(
        transcript.filename,
        transcript.content
      );

      for (const item of analysis.action_items) {
        await supabase.from("todos").insert({
          title: item.title,
          status: "todo",
          priority: item.priority,
          source_meeting: analysis.meeting_title,
        });
      }

      await supabase.from("meeting_summaries").insert({
        filename: transcript.filename,
        meeting_title: analysis.meeting_title,
        summary: analysis.summary,
        key_decisions: analysis.key_decisions,
        follow_ups: analysis.follow_ups,
        action_items_count: analysis.action_items.length,
        meeting_date: new Date().toISOString().split("T")[0],
      });

      await supabase.from("processed_files").insert({
        filename: transcript.filename,
        file_hash: Buffer.from(transcript.content.slice(0, 1000)).toString(
          "base64"
        ),
      });

      results.push({ filename: transcript.filename, analysis });
    }

    if (results.length > 0) {
      await sendSlackDigest(results);
    }

    return NextResponse.json({
      message: `Processed ${results.length} transcripts`,
      processed: results.length,
      meetings: results.map((r) => r.analysis.meeting_title),
    });
  } catch (error) {
    console.error("Digest error:", error);
    return NextResponse.json(
      { error: "Failed to process digest" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
