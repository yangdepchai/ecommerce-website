import { NextResponse } from "next/server";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { headers } from "next/headers";
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    
    // ... (Giữ nguyên phần Authentication và Check quyền sở hữu như cũ) ...
    // 1. Init Payload
    const payload = await getPayload({ config: configPromise });
    const requestHeaders = await headers();
    const { user } = await payload.auth({ headers: requestHeaders });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Check Orders
    const orders = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { orderedBy: { equals: user.id } },
          { status: { equals: 'paid' } },
          { 'items.product': { equals: productId } }
        ]
      },
      limit: 1,
    });
    const order = orders.docs[0];
    if (!order) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 3. Get Product
    const product = await payload.findByID({
      collection: 'products',
      id: productId,
      overrideAccess: true,
      depth: 2, 
    });
    const fileData = product.payloadFile as any; 
    if (!fileData?.url) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    // 4. --- BẮT ĐẦU XỬ LÝ BẢO MẬT ĐA TẦNG ---
    
    const appUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
    const fileUrl = `${appUrl}${fileData.url}`;
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-VariableFont_wdth,wght.ttf');
    
    if (!fs.existsSync(fontPath)) throw new Error(`Thiếu font: ${fontPath}`);

    const [existingPdfBytes, fontBytes] = await Promise.all([
        fetch(fileUrl).then(res => res.arrayBuffer()),
        fs.promises.readFile(fontPath)
    ]);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes); 

    const orderCode = order.payosOrderCode ? order.payosOrderCode : order.id;
    const infoString = `Licensed to ${user.email} (Order #${orderCode})`;

    // === TẦNG 1: METADATA INJECTION (ẨN SÂU TRONG FILE) ===
    // Dù xóa hết watermark, thông tin này vẫn nằm trong File Properties
    pdfDoc.setTitle(product.name);
    pdfDoc.setAuthor(`Licensed to: ${user.email}`);
    pdfDoc.setSubject(`Order #${orderCode}`);
    pdfDoc.setKeywords([user.email, `Order ${orderCode}`, "Protected"]);
    pdfDoc.setProducer("Marketplace Secure DRM System");
    pdfDoc.setCreator("Marketplace PDF Engine");

    const pages = pdfDoc.getPages();

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      
      // === TẦNG 2: INVISIBLE TRAP (MỰC TÀNG HÌNH - CHỐNG COPY) ===
      // Viết email màu trắng/trong suốt nhỏ xíu rải rác khắp nơi.
      // Nếu họ bôi đen copy text ra Word, dòng này sẽ đi theo.
      for (let i = 0; i < 5; i++) {
          const randX = Math.random() * width;
          const randY = Math.random() * height;
          page.drawText(`[Nguồn: ${user.email}]`, {
              x: randX,
              y: randY,
              size: 4, // Rất nhỏ
              font: customFont,
              color: rgb(0, 0, 0), // Màu đen
              opacity: 0.01, // Gần như tàng hình (mắt không thấy, nhưng máy vẫn đọc được text)
          });
      }

      // === TẦNG 3: RANDOMIZED VISUAL WATERMARK (CHỐNG AI XÓA) ===
      // AI học theo khuôn mẫu (pattern). Ta vẽ ngẫu nhiên để phá khuôn mẫu.
      
      // Vẽ 3 dòng watermark ở 3 vị trí ngẫu nhiên mỗi trang
      // Thay vì 1 dòng chéo cố định, mỗi trang sẽ khác nhau -> AI khó học
      for (let i = 0; i < 3; i++) {
          const randomRotation = -45 + Math.random() * 90; // Xoay từ -45 đến 45 độ
          const randomX = (width / 4) + Math.random() * (width / 2); // Vùng giữa trang
          const randomY = (height / 4) + Math.random() * (height / 2);
          const randomOpacity = 0.2 + Math.random() * 0.3; // Độ mờ từ 0.2 đến 0.5
          const randomSize = 18 + Math.random() * 10; // Cỡ chữ từ 18 đến 28

          page.drawText(user.email, {
            x: randomX,
            y: randomY,
            size: randomSize,
            font: customFont,
            color: rgb(0.6, 0.6, 0.6),
            opacity: randomOpacity,
            rotate: degrees(randomRotation),
          });
      }

      // Footer cố định (để cảnh báo)
      page.drawText(`Người sở hữu ${user.email} - #${orderCode}`, {
        x: 20,
        y: 10,
        size: 8,
        font: customFont,
        color: rgb(0.8, 0, 0),
        opacity: 0.8,
      });
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const safeFilename = product.name 
        ? product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() 
        : product.id;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="[Protected]_${safeFilename}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error("Download Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}