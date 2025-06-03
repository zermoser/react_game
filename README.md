# 🎮 React Game

เกมที่พัฒนาด้วย React + Vite + TypeScript และ TailwindCSS พร้อม Deploy ขึ้น GitHub Pages

---

## 📦 การติดตั้ง (Installation)

```bash
# ติดตั้ง dependencies
yarn install
🧪 การพัฒนา (Development)
bash
Copy
Edit
# เริ่มเซิร์ฟเวอร์สำหรับพัฒนา
yarn dev
🏗️ การ Build โปรเจกต์
bash
Copy
Edit
# build โปรเจกต์สำหรับ production
yarn build
🌍 การ Deploy ขึ้น GitHub Pages
bash
Copy
Edit
# ติดตั้ง gh-pages (ครั้งเดียวพอ)
yarn add -D gh-pages

# สร้าง production build และ deploy ขึ้น GitHub Pages
yarn deploy
⚙️ การตั้งค่าเพิ่มเติมที่จำเป็น
1. ตั้งค่า base path ใน vite.config.ts
ts
Copy
Edit
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ชื่อ-repo/', // เช่น '/react-game/'
  plugins: [react()],
});
2. แก้ไข scripts ใน package.json
json
Copy
Edit
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "vite build && gh-pages -d dist"
}
✅ เปิดใช้งาน GitHub Pages
เข้าไปที่หน้า GitHub Repository

ไปที่เมนู Settings → Pages

ที่หัวข้อ Source ให้เลือก gh-pages และ / (root)

กด Save

🔗 ลิงก์เว็บไซต์ของคุณจะหน้าตาแบบนี้
arduino
Copy
Edit
https://your-username.github.io/react-game/
เปลี่ยน your-username และ react-game ให้ตรงกับ repo และ GitHub ของคุณ