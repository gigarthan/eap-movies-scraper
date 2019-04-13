const express = require("express");
const cors = require("cors");
const scrape = require("./scraper/index");
const trivialdb = require("trivialdb");

const PORT = process.env.PORT || 8000;
const app = express();

const ns1 = trivialdb.ns("eap-ns");
const db = ns1.db("eap");

app.use(cors());
app.use(express.json());

app.get("/eap", (req, res) => {
  const data = db.filter({ key: "eap" });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  scrape();
  //scrape every three hours
  setInterval(scrape, 10800000);
});
