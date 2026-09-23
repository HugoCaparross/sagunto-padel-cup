import { NextResponse } from "next/server";

import {
    getAuthenticatedDestination,
} from "@/lib/auth/flow";

export async function GET(
    request: Request,
) {
    const destination =
        await getAuthenticatedDestination();

    return NextResponse.redirect(
        new URL(
            destination,
            request.url,
        ),
    );
}