import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { method, weight = 0.5, topK = 5, chunks = [] } = await req.json()

  const scored = chunks.map((c: any, idx: number) => {
    let s = c.score ?? 0
    if (method === "cosine") {
      s = s * (1 + weight * 0.2)
    } else if (method === "llm-re-rank") {
      // pretend LLM boost for early/middle chunks
      const boost = Math.sin((idx + 1) / 3) * 0.1
      s = s * (1 + weight * boost)
    }
    return { ...c, score: s }
  })

  scored.sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
  const limited = scored.slice(0, topK)

  return NextResponse.json({ chunks: limited })
}
