// TEMPORARY — delete this file once we've confirmed the API key works.
// Visit /api/test-places in your browser to test it.
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY is missing from .env.local" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating",
        },
        body: JSON.stringify({ textQuery: "Starbucks, Seattle" }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Google API returned an error", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, results: data });
  } catch (err) {
    return NextResponse.json(
      { error: "Request failed", details: String(err) },
      { status: 500 }
    );
  }
}