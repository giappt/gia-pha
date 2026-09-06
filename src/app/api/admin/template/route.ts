import { NextResponse } from 'next/server';
import { generateExcelTemplate } from '@/lib/excel/excel-parser';

export async function GET() {
  try {
    const buffer = generateExcelTemplate();

    return new Response(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="gia-pha-template.xlsx"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Không thể tạo file template' },
      { status: 500 }
    );
  }
}
