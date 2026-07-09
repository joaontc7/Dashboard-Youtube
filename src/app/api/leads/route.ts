import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const interesse = searchParams.get("interesse");
    const search = searchParams.get("search");

    const where: any = {};
    if (tag) where.tag = tag;
    if (interesse) where.interesse = interesse;
    if (search) where.displayName = { contains: search }; // Note: SQLite is case-insensitive by default with contains sometimes, but Prisma might have mode

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { comments: true }
    });

    return NextResponse.json(leads);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, displayName, tag, interesse, whatsapp, email, notes } = data;
    
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updated = await prisma.lead.update({
      where: { id },
      data: { displayName, tag, interesse, whatsapp, email, notes }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
