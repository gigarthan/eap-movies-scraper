const express = require("express");
const cors = require("cors");
const scrape = require("./scraper/index");
const trivialdb = require("trivialdb");
const request = require("request-promise-native");
const cheerio = require("cheerio");

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

app.get("/movie-rate/show-time/:id", async (req, res) => {
  try {
    const response = await request.post(
      "https://www.eapmovies.com/component/eapmovies/index.php",
      {
        form: {
          option: "com_eapmovies",
          controller: "ratesandshowtime",
          task: "getShowTimeList",
          sdate: "2019-05-05",
          tid: req.params.id,
          format: "raw"
        }
      }
    );

    const $ = cheerio.load(response);
    const $option = $("option");
    const resData = [];
    // console.log($option);
    for (let i = 0; i < $option.length; i++) {
      // console.log(cheerio($option[i]).val());
      $op = cheerio($option[i]);
      resData.push([$op.val(), $op.text()]);
    }

    res.send(resData);
  } catch (error) {
    res.status(400).json({ e: error.message });
  }
});

app.get("/movie-rate/movie-name", async (req, res) => {
  try {
    const { tid, sid, date } = req.query;
    const response = await request.post(
      "https://www.eapmovies.com/component/eapmovies/index.php",
      {
        form: {
          option: "com_eapmovies",
          controller: "ratesandshowtime",
          task: "getMovieName",
          sdate: date,
          tid: tid,
          sid: sid,
          format: "raw"
        }
      }
    );
    console.log(response);
    res.send(response.split("@")[0]);
  } catch (error) {
    res.status(400).json({ e: error.message });
  }
});

app.get("/movie-rate/rate", async (req, res) => {
  try {
    const { tid, sid, date } = req.query;
    console.log(tid, sid, date);
    const response = await request.post(
      "https://www.eapmovies.com/component/eapmovies/index.php",
      {
        form: {
          option: "com_eapmovies",
          controller: "ratesandshowtime",
          task: "getMovieRates",
          sdate: date,
          tid: tid,
          sid: sid,
          format: "raw"
        }
      }
    );

    console.log(response);
    const $res = cheerio.load(response);
    const trs = $res("tr");
    const resData = [];

    for (let index = 0; index < trs.length; index++) {
      const element = trs[index];
      const $e = cheerio.load(element);
      const th = $e("th");

      let ra = [];
      for (let j = 0; j < th.length; j++) {
        const thEl = th[j];
        const $thEl = cheerio.load(thEl);
        ra.push($thEl.text());
      }

      resData.push(ra);
      const td = $e("td");
      let ar = [];
      for (let j = 0; j < td.length; j++) {
        const tdEl = td[j];
        const $tdEl = cheerio.load(tdEl);
        ar.push($tdEl.text());
      }
      resData.push(ar);
    }

    console.log(resData);
    res.send(resData.filter(r => r.length !== 0));
  } catch (error) {
    res.status(400).json({ e: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  //scrape every three hours
  setInterval(scrape, 10800000);
});
