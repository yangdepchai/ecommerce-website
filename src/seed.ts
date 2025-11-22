import {getPayload} from "payload";
import config from "@payload-config";

const categories = [
  {
    name: "All",
    slug: "all",
  },
  {
    name: "Tài Khoản & Bản Quyền",
    slug: "tai-khoan-ban-quyen",
    subcategories: [
      { name: "Tài khoản Giải trí (Netflix, Spotify...)", slug: "tai-khoan-giai-tri" },
      { name: "Tài khoản Học tập (Coursera, Udemy...)", slug: "tai-khoan-hoc-tap" },
      { name: "Key Windows & Office", slug: "key-windows-office" },
      { name: "Phần mềm Diệt Virus", slug: "phan-mem-diet-virus" },
      { name: "Tài khoản VPN & IP", slug: "tai-khoan-vpn" },
    ],
  },
  {
    name: "Game & Nạp Thẻ",
    slug: "game-nap-the",
    subcategories: [
      { name: "Steam Wallet & Key Game", slug: "steam-wallet-key-game" },
      { name: "Thẻ Garena & Zing Xu", slug: "the-garena-zing" },
      { name: "Vật phẩm Game (Item/Skin)", slug: "vat-pham-game" },
      { name: "Tài khoản Game", slug: "tai-khoan-game" },
      { name: "Cày thuê & Dịch vụ Game", slug: "cay-thue-dich-vu" },
    ],
  },
  {
    name: "Thiết Kế & Đồ Họa",
    slug: "thiet-ke-do-hoa",
    subcategories: [
      { name: "Font chữ Việt hóa", slug: "font-chu" },
      { name: "Logo & Banner Template", slug: "logo-banner-template" },
      { name: "UI/UX Kits & Mockups", slug: "ui-ux-kits" },
      { name: "Stock Ảnh & Vector", slug: "stock-anh-vector" },
      { name: "Preset Lightroom & LUTs", slug: "preset-lightroom-luts" },
    ],
  },
  {
    name: "Lập Trình & Mã Nguồn",
    slug: "lap-trinh-ma-nguon",
    subcategories: [
      { name: "Website Themes & Templates", slug: "website-themes" },
      { name: "WordPress Plugins", slug: "wordpress-plugins" },
      { name: "Source Code Mobile App", slug: "source-code-app" },
      { name: "Scripts & Code Snippets", slug: "scripts-code" },
      { name: "Tool & Bot tự động hóa", slug: "tool-bot-auto" },
    ],
  },
  {
    name: "Marketing & Dịch Vụ MXH",
    slug: "marketing-dich-vu-mxh",
    subcategories: [
      { name: "Tăng Like/Follow/View", slug: "tang-tuong-tac" },
      { name: "Tài khoản Quảng cáo (Ads)", slug: "tai-khoan-quang-cao" },
      { name: "Email Marketing & Data", slug: "email-marketing-data" },
      { name: "Content & Bài viết mẫu", slug: "content-bai-viet" },
      { name: "Phần mềm SEO", slug: "phan-mem-seo" },
    ],
  },
  {
    name: "Khóa Học & Ebook",
    slug: "khoa-hoc-ebook",
    subcategories: [
      { name: "Khóa học IT & Lập trình", slug: "khoa-hoc-it" },
      { name: "Khóa học Ngoại ngữ", slug: "khoa-hoc-ngoai-ngu" },
      { name: "Khóa học Marketing & Sale", slug: "khoa-hoc-marketing" },
      { name: "Ebook & Sách nói", slug: "ebook-sach-noi" },
      { name: "Tài liệu ôn thi", slug: "tai-lieu-on-thi" },
    ],
  },
  {
    name: "Âm Thanh & Video",
    slug: "am-thanh-video",
    subcategories: [
      { name: "Stock Music & Sound Effects", slug: "stock-music-sfx" },
      { name: "Video Intro & Outro", slug: "video-intro-outro" },
      { name: "Project After Effects/Premiere", slug: "project-ae-pr" },
      { name: "Beat nhạc & Voice mẫu", slug: "beat-nhac-voice" },
    ],
  },
  {
    name: "Tiện Ích & Khác",
    slug: "tien-ich-khac",
    subcategories: [
      { name: "Voucher & Mã giảm giá", slug: "voucher-giam-gia" },
      { name: "Dịch vụ Server/Hosting", slug: "server-hosting" },
      { name: "Tư vấn & Cài đặt phần mềm", slug: "tu-van-cai-dat" },
      { name: "Sản phẩm số khác", slug: "san-pham-so-khac" },
    ],
  },
];
const seed = async () => {
    const payload = await getPayload({config});
    const adminTenant = await payload.create({
        collection: "tenants",
        data: {
          name:"admin",
          slug:"admin",
          stripeAccountId: "admin_account",
        },
    });

    await payload.create({
      collection: "users",
      data:{
        email: "admin@demo.com",
        password: "demo",
        roles:["super-admin"],
        username:"admin",
        tenants:[
          {
            tenant: adminTenant.id,
          },
        ],
      },
    });
    for (const category of categories){
        const parentCategory = await payload.create({
            collection: "categories",
            data: {
                name: category.name,
                slug:category.slug,
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