import Hatchet from '@hatchet-dev/typescript-sdk';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    const hatchet = Hatchet.init({
      token: process.env.HATCHET_CLIENT_TOKEN!,
    });

    console.log('Triggering document processing workflow...');

    // Send document:process event with realistic data
    const documentId = `doc-${Date.now()}`;
    const result = await hatchet.events.push('document:process', {
      document_id: documentId,
      file_path: `/uploads/${documentId}.pdf`
    });

    console.log('Event pushed: ', result);

    return NextResponse.json({
      success: true,
      message: 'Document processing workflow triggered',
      documentId: documentId,
      result
    })
  } catch(error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
