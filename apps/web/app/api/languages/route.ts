import { NextResponse } from "next/server";
import { getLanguageList } from "@/lib/server";

export async function GET() {
  return NextResponse.json(await getLanguageList());
}
