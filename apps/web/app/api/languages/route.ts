import { NextResponse } from "next/server";
import { getLanguages } from "@/lib/server";

export async function GET() {
  return NextResponse.json(await getLanguages());
}
