const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const Tesseract = require("tesseract.js");
const bodyParser = require('body-parser');
const app = express();

let recognizetext;
let inputValue;

app.use(bodyParser.urlencoded({ extended: true })); 

const storage = multer.diskStorage({
  destination: "../uploads",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("ImageFile");


function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Images Only ! Supported formats jpeg | jpg | png");
  }
}

const template_path = path.join(__dirname, "../views");


app.set("view engine", "hbs");
app.use(express.static("../public"));
app.set("views", template_path);

app.get("/", (req, res) => res.render("index"));

app.get("*", (req, res) => res.render("index"));

app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.render("index", {
        msg: err,
      });
    } else {
      if (req.file == undefined) {
        res.render("index", {
          msg: "No File Selected!",
        });
      } else {
      
        Tesseract.recognize(`../uploads/${req.file.filename}`, `${req.body.language}`, {
          logger: (m) => {
            inputValue=m.progress;
          },
        }).then(({ data: { text } }) => {
          recognizetext = text;
          res.render("index", {
            msg: "Recognizing done 100% !",
            text: `${recognizetext}`,
            heading:"Recognized Text"
          });  
        });
      }
    }
  });
});

const port = 8000 || process.env.PORT;
app.listen(port, () => console.log(`Server started on port ${port}`));
