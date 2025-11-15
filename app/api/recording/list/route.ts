import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const recordingsDir = path.join(process.cwd(), 'public', 'recordings');

    if (!existsSync(recordingsDir)) {
      return NextResponse.json({ recordings: [] });
    }

    const files = await readdir(recordingsDir);
    const metadataFiles = files.filter((f) => f.endsWith('_metadata.json'));

    const recordings = await Promise.all(
      metadataFiles.map(async (file) => {
        const content = await readFile(path.join(recordingsDir, file), 'utf-8');
        return JSON.parse(content);
      }),
    );

    // Sort by start time (newest first)
    recordings.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return NextResponse.json({ recordings });
  } catch (error) {
    console.error('Error listing recordings:', error);
    return NextResponse.json({ error: 'Failed to list recordings' }, { status: 500 });
  }
}
