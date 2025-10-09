let cached = { reRanking: true, topK: 6 }

export async function GET() {
  return Response.json(cached)
}

export async function POST(req: Request) {
  const body = await req.json()
  cached = { ...cached, ...body }
  return Response.json(cached)
}
