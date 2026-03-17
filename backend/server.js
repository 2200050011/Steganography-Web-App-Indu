const express = require("express");
const multer = require("multer");
const cors = require("cors");
const CryptoJS = require("crypto-js");
const Jimp = require("jimp");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

/* 🔐 ENCODE */
app.post("/encode", upload.single("image"), async (req, res) => {
    try {
        const { message, key } = req.body;
        const imagePath = req.file.path;

        const encrypted = CryptoJS.AES.encrypt(message, key).toString();

        const image = await Jimp.read(imagePath);

        let binaryMsg = "";
        for (let i = 0; i < encrypted.length; i++) {
            binaryMsg += encrypted.charCodeAt(i).toString(2).padStart(8, "0");
        }

        binaryMsg += "1111111111111110"; // End marker

        let index = 0;

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            if (index < binaryMsg.length) {
                this.bitmap.data[idx] =
                    (this.bitmap.data[idx] & 254) | parseInt(binaryMsg[index]);
                index++;
            }
        });

        const outputPath = "encoded.png";
        await image.writeAsync(outputPath);

        res.download(outputPath);

    } catch (err) {
        console.error(err);
        res.status(500).send("Encoding failed");
    }
});

/* 🔓 DECODE */
app.post("/decode", upload.single("image"), async (req, res) => {
    try {
        const { key } = req.body;

        const image = await Jimp.read(req.file.path);

        let binaryMsg = "";

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            binaryMsg += (this.bitmap.data[idx] & 1);
        });

        let chars = [];

        for (let i = 0; i < binaryMsg.length; i += 8) {
            let byte = binaryMsg.substr(i, 8);
            if (byte === "11111110") break;
            chars.push(String.fromCharCode(parseInt(byte, 2)));
        }

        const encrypted = chars.join("");

        const bytes = CryptoJS.AES.decrypt(encrypted, key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);

        res.json({ message: originalText });

    } catch (err) {
        console.error(err);
        res.status(500).send("Decoding failed");
    }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
