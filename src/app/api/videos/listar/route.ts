import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ videos: [] });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ videos: [] });

  const { data, error } = await supabase
    .from("generated_videos")
    .select("id, variante, guion, video_url, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ videos: data ?? [] });
}
