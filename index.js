// app.js
import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";

import router from "./routes/route.js";


dotenv.config();

const app = express();
const httpserver = createServer(app);

app.use(express.static("public"));
app.use(express.json());

app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

app.use(cors());

app.use(router);

httpserver.listen(process.env.APP_PORT, () => {
  console.log("Server running on port " + process.env.APP_PORT);
});
