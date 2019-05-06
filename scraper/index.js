const URLS = require("./urls.js");
const puppet = require("puppeteer");
const trivialdb = require("trivialdb");

const ns1 = trivialdb.ns("eap-ns");
const db = ns1.db("eap");

const scrape = async () => {
  try {
    const browser = await puppet.launch();
    const page = await browser.newPage();
    await page.goto(URLS.movieList);

    const nowShowing = await page.evaluate(() => {
      const $upcomingShowingWrap = $(".upcoming_wrp");
      const $upcomingShowing = $upcomingShowingWrap.find(".upcoming_movie");
      const upcomingMovieList = $upcomingShowing.toArray().map(item => {
        const $item = $(item);
        const $image = $item.find("img");
        const $name = $item.find(".ucm_bottom_wrp h6");
        return {
          name: $name.html(),
          imageUrl: $image[0].currentSrc
        };
      });

      const $nowShowingWrap = $(".nowshowing_wrp");
      const $nowShowing = $nowShowingWrap.find(".nowshowing_movie");
      const movieList = $nowShowing.toArray().map(item => {
        const $item = $(item);
        const $image = $item.find("img");
        const $name = $item.find(".nsm_bottom_wrp h6");
        return {
          name: $name.html(),
          imageUrl: $image[0].currentSrc
        };
      });

      return [movieList, upcomingMovieList];
    });

    await page.goto(URLS.offers);

    const offersList = await page.evaluate(() => {
      const $offers = $(".offer_wrp");
      const offerList = $offers.toArray().map(item => {
        const $item = $(item);
        const $image = $item.find("img");

        return $image[0].currentSrc;
      });

      return offerList;
    });

    // console.log(nowShowing);
    // console.log(offersList);
    await browser.close();

    const data = {
      key: "eap",
      upcoming: nowShowing[1],
      nowShowing: nowShowing[0],
      offers: offersList
    };

    await db.clear();
    const id = await db.save(data);
    console.log("saved id", id);
  } catch (error) {
    console.log("[scrape]", error);
  }
};

module.exports = scrape;
