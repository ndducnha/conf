import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { recordingId, roomName } = await request.json();

    if (!recordingId) {
      return NextResponse.json({ error: 'Recording ID is required' }, { status: 400 });
    }

    // Update recording metadata
    const recordingsDir = path.join(process.cwd(), 'public', 'recordings');
    const metadataPath = path.join(recordingsDir, `${recordingId}_metadata.json`);

    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    metadata.endTime = new Date().toISOString();
    metadata.status = 'completed';
    metadata.duration =
      new Date(metadata.endTime).getTime() - new Date(metadata.startTime).getTime();
    metadata.videoFile = `${recordingId}.webm`;
    metadata.videoPath = `/recordings/${recordingId}.webm`;

    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      recordingId,
      message: 'Recording stopped and saved',
    });
  } catch (error) {
    console.error('Error stopping recording:', error);
    return NextResponse.json({ error: 'Failed to stop recording' }, { status: 500 });
  }
}
