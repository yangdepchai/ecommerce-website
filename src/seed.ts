import {getPayload} from "payload";
import config from "@payload-config";

const categories = [
  {
    name: "All",
    slug: "all",
  },
  {
    name: "Công Nghệ & Điện Tử",
    color: "#007BFF", // Màu Xanh Dương
    slug: "cong-nghe-dien-tu",
    subcategories: [
      { name: "Điện Thoại & Phụ Kiện", slug: "dien-thoai-phu-kien" },
      { name: "Máy Tính & Laptop", slug: "may-tinh-laptop" },
      { name: "Thiết Bị Âm Thanh & Camera", slug: "am-thanh-camera" },
      { name: "Linh Kiện & Phụ Tùng", slug: "linh-kien-phu-tung" },
      { name: "Đồ Gia Dụng Thông Minh", slug: "gia-dung-thong-minh" },
    ],
  },
  {
    name: "Thời Trang & Phụ Kiện",
    color: "#E91E63", // Màu Hồng Đỏ
    slug: "thoi-trang-phu-kien",
    subcategories: [
      { name: "Thời Trang Nam", slug: "thoi-trang-nam" },
      { name: "Thời Trang Nữ", slug: "thoi-trang-nu" },
      { name: "Giày Dép", slug: "giay-dep" },
      { name: "Túi Xách & Ví", slug: "tui-xach-vi" },
      { name: "Trang Sức & Đồng Hồ", slug: "trang-suc-dong-ho" },
    ],
  },
  {
    name: "Nhà Cửa & Đời Sống",
    color: "#4CAF50", // Màu Xanh Lá Cây
    slug: "nha-cua-doi-song",
    subcategories: [
      { name: "Nội Thất & Trang Trí", slug: "noi-that-trang-tri" },
      { name: "Thiết Bị Nhà Bếp", slug: "thiet-bi-nha-bep" },
      { name: "Đồ Dùng Phòng Tắm", slug: "do-dung-phong-tam" },
      { name: "Dụng Cụ Làm Vườn", slug: "dung-cu-lam-vuon" },
      { name: "Văn Phòng Phẩm", slug: "van-phong-pham" },
    ],
  },
  {
    name: "Sắc Đẹp & Sức Khỏe",
    color: "#FFC107", // Màu Vàng Hổ Phách
    slug: "sac-dep-suc-khoe",
    subcategories: [
      { name: "Chăm Sóc Da Mặt", slug: "cham-soc-da-mat" },
      { name: "Trang Điểm", slug: "trang-diem" },
      { name: "Chăm Sóc Tóc & Cơ Thể", slug: "cham-soc-toc-co-the" },
      { name: "Thực Phẩm Chức Năng", slug: "thuc-pham-chuc-nang" },
      { name: "Thiết Bị Y Tế & Massage", slug: "thiet-bi-y-te" },
    ],
  },
  {
    name: "Mẹ & Bé",
    color: "#FF9800", // Màu Cam
    slug: "me-va-be",
    subcategories: [
      { name: "Thức Ăn Dặm & Sữa", slug: "thuc-an-sua" },
      { name: "Đồ Chơi & Đồ Dùng Học Tập", slug: "do-choi-hoc-tap" },
      { name: "Quần Áo Trẻ Em", slug: "quan-ao-tre-em" },
      { name: "Xe Đẩy & Ghế Ăn", slug: "xe-day-ghe-an" },
    ],
  },
  {
    name: "Ô Tô, Xe Máy & Xe Đạp",
    color: "#607D8B", // Màu Xám Xanh
    slug: "oto-xe-may",
    subcategories: [
      { name: "Phụ Tùng Ô Tô", slug: "phu-tung-oto" },
      { name: "Phụ Kiện Xe Máy", slug: "phu-kien-xe-may" },
      { name: "Dầu Nhớt & Chăm Sóc Xe", slug: "dau-nhot-cham-soc" },
      { name: "Xe Đạp & Xe Điện", slug: "xe-dap-xe-dien" },
    ],
  },
  {
    name: "Thể Thao & Du Lịch",
    color: "#03A9F4", // Màu Xanh Lam Nhạt
    slug: "the-thao-du-lich",
    subcategories: [
      { name: "Dụng Cụ Tập Gym/Yoga", slug: "dung-cu-tap-gym" },
      { name: "Trang Phục Thể Thao", slug: "trang-phuc-the-thao" },
      { name: "Thiết Bị Cắm Trại & Leo Núi", slug: "cam-trai-leo-nui" },
      { name: "Vali & Balo Du Lịch", slug: "vali-balo" },
    ],
  },
  {
    name: "Thực Phẩm & Bách Hóa",
    color: "#8BC34A", // Màu Xanh Lá Cây Nhạt
    slug: "thuc-pham-bach-hoa",
    subcategories: [
      { name: "Thực Phẩm Khô & Đóng Hộp", slug: "thuc-pham-kho" },
      { name: "Rau Củ Quả Tươi", slug: "rau-cu-qua-tuoi" },
      { name: "Đồ Uống & Nước Giải Khát", slug: "do-uong" },
      { name: "Đặc Sản Vùng Miền", slug: "dac-san-vung-mien" },
    ],
  },
  {
    name: "Dịch Vụ & Sản Phẩm Số (Digital)",
    color: "#9C27B0", // Màu Tím
    slug: "dich-vu-san-pham-so",
    subcategories: [
      { name: "Thiết Kế Đồ Họa", slug: "thiet-ke-do-hoa" },
      { name: "Phần Mềm & Ứng Dụng", slug: "phan-mem-ung-dung" },
      { name: "Khóa Học Trực Tuyến", slug: "khoa-hoc-online" },
      { name: "Ebook & Tài Liệu", slug: "ebook-tai-lieu" },
    ],
  },
  {
    name: "Sách & Văn Hóa",
    color: "#795548", // Màu Nâu
    slug: "sach-van-hoa",
    subcategories: [
      { name: "Sách Văn Học", slug: "sach-van-hoc" },
      { name: "Sách Kinh Tế & Kỹ Năng", slug: "sach-kinh-te" },
      { name: "Truyện Tranh & Manga", slug: "truyen-tranh" },
      { name: "Nhạc Cụ & Phụ Kiện", slug: "nhac-cu-phu-kien" },
    ],
  },
]

const seed = async () => {
    const payload = await getPayload({config});

    for (const category of categories){
        const parentCategory = await payload.create({
            collection: "categories",
            data: {
                name: category.name,
                slug:category.slug,
                color:category.color,
                parent: null,
            },
        });

        for (const subCategory of category.subcategories || []){
            await payload.create({
                collection: "categories",
                data: {
                    name: subCategory.name,
                    slug:subCategory.slug,
                    parent: parentCategory.id,
                },
            });
        }
    }
}

await seed();

process.exit(0);