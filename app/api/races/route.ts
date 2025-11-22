import { NextResponse } from 'next/server'
import { getAvailableRaces } from '@/app/actions/public'

export async function GET() {
  const result = await getAvailableRaces()

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ races: result.races })
}
