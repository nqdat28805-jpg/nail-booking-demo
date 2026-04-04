export type ShopPriceReviewStatus = "confirmed" | "review" | "ocr_uncertain";

export type ShopPriceItem = {
  id: string;
  name: string;
  priceLabel: string;
  priceMin?: number;
  priceMax?: number;
  unit?: string;
  notes?: string;
  reviewStatus?: ShopPriceReviewStatus;
};

export type ShopPriceCategory = {
  id: string;
  title: string;
  items: ShopPriceItem[];
};

export const NINETEEN_NAIL_STUDIO_PRICE_CONFIG = {
  shopId: "19nail-studio",
  shopName: "19NAIL.STUDIO",
  referenceImagePath:
    "C:/X/PERSONAL/ki work/ki/19nail-main-price-menu.png",
  notes: [
    "Config này chỉ áp dụng cho 19NAIL.STUDIO.",
    "Dùng cho hiển thị landing page trước; chưa nối vào logic giá ở bước đặt lịch.",
  ],
  reviewNotes: {
    confirmed: [
      "Đã xác nhận 5 nhóm giá chính: Nail cơ bản, Móng giả, Design, Phụ kiện, Combo chân.",
      "Đã xác nhận các mức giá/range rõ nét trên menu cho đa số dịch vụ.",
    ],
    uncertain: [
      "Sơn gel có thêm một dòng phụ về phụ thu màu, OCR chưa đủ chắc để chốt dấu cộng/trừ và câu đầy đủ.",
      "Một số mục phụ kiện nhiều khả năng tính theo 'viên', nhưng chữ đơn vị trên ảnh chưa đủ sắc nét nên được giữ ở trạng thái OCR_UNCERTAIN.",
      "Tên mục 'Úp móng mài cách chân (úp gel)' vẫn cần đối chiếu tay lần cuối để chốt chính tả 'mài/mai'.",
    ],
  },
  categories: [
    {
      id: "nail-co-ban",
      title: "Nail cơ bản",
      items: [
        {
          id: "sua-mong",
          name: "Sửa móng (nhặt da, dũa form)",
          priceLabel: "40.000đ",
          priceMin: 40000,
          priceMax: 40000,
        },
        {
          id: "son-gel",
          name: "Sơn gel",
          priceLabel: "80.000đ",
          priceMin: 80000,
          priceMax: 80000,
          notes: "OCR_UNCERTAIN: ảnh có thêm một dòng phụ thu màu '20.000đ trên 3 màu' nhưng cần đối chiếu tay lần cuối.",
          reviewStatus: "ocr_uncertain",
        },
        {
          id: "cung-mong-tao-cau",
          name: "Cứng móng tạo cầu",
          priceLabel: "30.000đ - 70.000đ",
          priceMin: 30000,
          priceMax: 70000,
        },
        {
          id: "pha-mong-that",
          name: "Phá móng thật (tuỳ độ dày)",
          priceLabel: "10.000đ - 20.000đ",
          priceMin: 10000,
          priceMax: 20000,
        },
        {
          id: "pha-mong-gia",
          name: "Phá móng giả (tuỳ độ dày)",
          priceLabel: "30.000đ - 40.000đ",
          priceMin: 30000,
          priceMax: 40000,
        },
      ],
    },
    {
      id: "mong-gia",
      title: "Móng giả",
      items: [
        {
          id: "up-mong-mai-cach-chan",
          name: "Úp móng mài cách chân (úp gel)",
          priceLabel: "100.000đ",
          priceMin: 100000,
          priceMax: 100000,
          notes: "REVIEW: cần đối chiếu lần cuối chữ 'mài/mai' từ ảnh gốc.",
          reviewStatus: "review",
        },
        {
          id: "noi-mong-dap-gel",
          name: "Nối móng đắp gel",
          priceLabel: "210.000đ",
          priceMin: 210000,
          priceMax: 210000,
        },
        {
          id: "dap-gel-mong-that",
          name: "Dập gel móng thật",
          priceLabel: "80.000đ - 100.000đ",
          priceMin: 80000,
          priceMax: 100000,
        },
        {
          id: "fill-mong-noi-gel",
          name: "Fill móng nối gel",
          priceLabel: "100.000đ - 120.000đ",
          priceMin: 100000,
          priceMax: 120000,
        },
        {
          id: "fill-up-gel",
          name: "Fill úp gel",
          priceLabel: "50.000đ",
          priceMin: 50000,
          priceMax: 50000,
        },
      ],
    },
    {
      id: "design",
      title: "Design",
      items: [
        {
          id: "ve-hoat-hinh-ve-design",
          name: "Vẽ hoạt hình / Vẽ design",
          priceLabel: "5.000đ - 100.000đ / ngón",
          priceMin: 5000,
          priceMax: 100000,
          unit: "ngón",
          notes: "Tuỳ độ khó, dễ.",
        },
        {
          id: "ombre-trang-guong-nhu-mat-meo",
          name: "Ombre / Tráng gương / Nhũ / Mắt mèo",
          priceLabel: "10.000đ / ngón",
          priceMin: 10000,
          priceMax: 10000,
          unit: "ngón",
        },
        {
          id: "foil-khong-nuoc-sticker",
          name: "Foil / Không nước / Sticker",
          priceLabel: "5.000đ - 10.000đ / ngón",
          priceMin: 5000,
          priceMax: 10000,
          unit: "ngón",
        },
        {
          id: "an-xa-cu-hoa-kho",
          name: "Ăn xà cừ / Hoa khô",
          priceLabel: "10.000đ - 20.000đ / ngón",
          priceMin: 10000,
          priceMax: 20000,
          unit: "ngón",
        },
        {
          id: "loang-van-da",
          name: "Loang / Vân đá",
          priceLabel: "10.000đ - 25.000đ / ngón",
          priceMin: 10000,
          priceMax: 25000,
          unit: "ngón",
        },
        {
          id: "ve-gel-noi",
          name: "Vẽ gel nổi",
          priceLabel: "5.000đ - 25.000đ / ngón",
          priceMin: 5000,
          priceMax: 25000,
          unit: "ngón",
        },
      ],
    },
    {
      id: "phu-kien",
      title: "Phụ kiện",
      items: [
        {
          id: "dinh-da-vien",
          name: "Đính đá viền (tuỳ size đá)",
          priceLabel: "5.000đ - 20.000đ",
          priceMin: 5000,
          priceMax: 20000,
          notes: "OCR_UNCERTAIN: nhiều khả năng tính theo viên.",
          reviewStatus: "ocr_uncertain",
        },
        {
          id: "dinh-phu-kien-kim-loai",
          name: "Đính phụ kiện kim loại",
          priceLabel: "5.000đ - 10.000đ",
          priceMin: 5000,
          priceMax: 10000,
          notes: "OCR_UNCERTAIN: nhiều khả năng tính theo viên.",
          reviewStatus: "ocr_uncertain",
        },
        {
          id: "da-khoi",
          name: "Đá khối (tuỳ size đá)",
          priceLabel: "15.000đ - 40.000đ",
          priceMin: 15000,
          priceMax: 40000,
          notes: "OCR_UNCERTAIN: nhiều khả năng tính theo viên.",
          reviewStatus: "ocr_uncertain",
        },
        {
          id: "charm",
          name: "Charm",
          priceLabel: "10.000đ - 40.000đ",
          priceMin: 10000,
          priceMax: 40000,
          notes: "OCR_UNCERTAIN: nhiều khả năng tính theo viên.",
          reviewStatus: "ocr_uncertain",
        },
      ],
    },
    {
      id: "combo-chan",
      title: "Combo chân",
      items: [
        {
          id: "ngam-chan-muoi-coffee",
          name: "Ngâm chân muối coffee, tẩy tế bào chết, chà gót",
          priceLabel: "150.000đ",
          priceMin: 150000,
          priceMax: 150000,
        },
        {
          id: "dap-mat-na-chan",
          name: "Đắp mặt nạ chân (nửa / full)",
          priceLabel: "25.000đ - 40.000đ",
          priceMin: 25000,
          priceMax: 40000,
        },
      ],
    },
  ] satisfies ShopPriceCategory[],
} as const;
