import { NextResponse } from "next/server";

import {
    getAuthenticatedDestination,
} from "@/lib/auth/flow";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const next = getSafeNextPath(url.searchParams.get("next"));
    const destination = await getAuthenticatedDestination(next);

    return NextResponse.redirect(
        new URL(destination, request.url),
    );
}