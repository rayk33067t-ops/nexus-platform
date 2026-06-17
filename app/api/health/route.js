export async function GET() {
  return Response.json({ status: 'connected', message: 'Supabase working' })
}
