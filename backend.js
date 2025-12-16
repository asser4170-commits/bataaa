const express = require("express");
const app = express();

app.use(express.json());

// تخزين عام (في الذاكرة)
let GLOBAL_DATA = {};

// حفظ البيانات
app.post("/save", (req, res) => {
  GLOBAL_DATA = req.body;
  res.json({ status: "saved" });
});

// قراءة البيانات
app.get("/load", (req, res) => {
  res.json(GLOBAL_DATA);
});

// تشغيل السيرفر
app.listen(3000, () => {
  console.log("Backend running on port 3000");
});
