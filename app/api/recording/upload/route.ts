import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    const recordingId = formData.get('recordingId') as string;

    if (!video || !recordingId) {
      return NextResponse.json(
        { error: 'Video file and recording ID are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save video file to recordings directory
    const recordingsDir = path.join(process.cwd(), 'public', 'recordings');
    const videoPath = path.join(recordingsDir, `${recordingId}.webm`);

    await writeFile(videoPath, buffer);

    return NextResponse.json({
      success: true,
      message: 'Recording uploaded successfully',
      filePath: `/recordings/${recordingId}.webm`,
    });
  } catch (error) {
    console.error('Error uploading recording:', error);
    return NextResponse.json(
      { error: 'Failed to upload recording' },
      { status: 500 }
    );
  }
}
