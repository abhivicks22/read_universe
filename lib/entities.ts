/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

export interface EntityResult {
    people: string[];
    places: string[];
    organizations: string[];
}

export async function extractEntities(pages: string[]): Promise<EntityResult> {
    // Dynamic import to avoid SSR issues
    const nlp = (await import('compromise')).default;

    const fullText = pages.join('\n\n');
    const doc = nlp(fullText);

    const peopleSet = new Set<string>();
    const placesSet = new Set<string>();
    const orgSet = new Set<string>();

    // Extract people
    doc.people().forEach((p: any) => {
        const name = p.text().trim();
        if (name.length > 1 && name.split(' ').length <= 4) {
            peopleSet.add(name);
        }
    });

    // Extract places
    doc.places().forEach((p: any) => {
        const place = p.text().trim();
        if (place.length > 1) {
            placesSet.add(place);
        }
    });

    // Extract organizations
    doc.organizations().forEach((o: any) => {
        const org = o.text().trim();
        if (org.length > 1) {
            orgSet.add(org);
        }
    });

    return {
        people: [...peopleSet].slice(0, 50),
        places: [...placesSet].slice(0, 50),
        organizations: [...orgSet].slice(0, 30),
    };
}

export function extractEntitiesFromPage(pageText: string): EntityResult {
    // Sync version not possible with dynamic import — use the async version
    // This is a lightweight fallback for single pages
    const people: string[] = [];
    const places: string[] = [];
    const organizations: string[] = [];

    // Simple capitalized word detection as fallback
    const words = pageText.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+/g) || [];
    const unique = [...new Set(words)];

    unique.forEach((w) => {
        if (w.split(' ').length <= 3) {
            people.push(w);
        }
    });

    return { people: people.slice(0, 20), places, organizations };
}
