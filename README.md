# 🔷 Voronoi Diagram — Divide & Conquer Edition ✂️🧩

> Drop some dots 🎯, hit a button 🖱️, and watch the plane split itself into cozy little territories 🏡🏡🏡

Term project for **Design and Analysis of Algorithms** 🎓 at NSYSU 🌊

---

## ✨ What it does

- 🖱️ **Click** on the canvas to add points
- 📂 **Load** points from a test input file
- ▶️ **Run**: computes everything to the end 🏁
- 👣 **Step by step**: pauses before each merge and paints the left 🟥 and right 🟦 halves in different colors
- 💾 **Save** the result as a text file
- 🖼️ **Load** a saved result file and draw it

## 🚀 Quick start

Just double-click 👇

```text
run.bat
```

…and it opens in your browser 🌐 No installs needed 🙌

## 🛠️ Build it yourself

Requires 🟢 Node.js (LTS)

```bash
npm install
```

```bash
npm run build
```

👨‍💻 For development (auto-rebuilds every time you save):

```bash
npm run watch
```

## 📄 File formats

📥 **Input**: number of points, then one `x y` per line; `#` lines are comments; a `0` means stop 🛑

```text
3
200 200
300 200
200 300
0
```

📤 **Output**: points 📍 first, then edges 📏, both in lexical order

```text
P 103 200
P 193 64
E 0 34 193 161
E 193 161 193 261
```

## 🧰 Tech stack

🟦 TypeScript · ⚡ esbuild · 🎨 HTML Canvas

## 🗂️ Project layout

```text
📁 src/         ← TypeScript source 🧠
📁 dist/        ← built app.js 📦
📄 index.html   ← the app 🖥️
📄 run.bat      ← double-click me! 👆
```