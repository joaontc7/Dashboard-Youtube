import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;
    
    return NextResponse.json({
      status: "DIAGNOSTICS",
      tursoUrl: {
        valueType: typeof tursoUrl,
        valueString: tursoUrl,
        length: tursoUrl ? tursoUrl.length : 0,
        isUndefinedString: tursoUrl === "undefined",
        isNullString: tursoUrl === "null",
      },
      tursoToken: {
        valueType: typeof tursoToken,
        length: tursoToken ? tursoToken.length : 0,
        isUndefinedString: tursoToken === "undefined",
        isNullString: tursoToken === "null",
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: "ERROR", 
      error: error.message
    }, { status: 500 });
  }
}

