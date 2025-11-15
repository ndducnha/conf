import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { roomName } = await request.json();

    if (!roomName) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    // Create recordings directory if it doesn't exist
    const recordingsDir = path.join(process.cwd(), 'public', 'recordings');
    if (!existsSync(recordingsDir)) {
      await mkdir(recordingsDir, { recursive: true });
    }

    // Generate unique recording ID
    const recordingId = `${roomName}_${Date.now()}`;
    const metadataPath = path.join(recordingsDir, `${recordingId}_metadata.json`);

    // Save recording metadata
    const metadata = {
      recordingId,
      roomName,
      startTime: new Date().toISOString(),
      status: 'recording',
    };

    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      recordingId,
      message: 'Recording started',
    });
  } catch (error) {
    console.error('Error starting recording:', error);
    return NextResponse.json({ error: 'Failed to start recording' }, { status: 500 });
  }
}
