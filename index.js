const puppeteer = require("puppeteer");
const fs = require("fs");
const data = require("./csvjson.json");
const resultJson = require("./result.json");

function getData(start, end) {
  return data.slice(start, Math.min(end, data.length));
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

function translatedTextToJson(translatedText, index) {
  let result = index ? `"id": ${index}, ` : "";
  result += translatedText;
  result = result.replaceAll("<br>", "");
  result = result.replaceAll("<span>", "");
  result = result.replaceAll("</span>", "");
  result = result.replaceAll("\\n", "");
  result = result.replaceAll("\n", "");
  result = result.replaceAll(`","`, `",`);
  result = result.replace("칵테일 이름", '"Cocktail Name"');
  result = result.replace("바텐더", "Bartender");
  result = result.replace("바/회사", "Bar/Company");
  result = result.replace("위치", "Location");
  result = result.replace("재료", "Ingredients");
  result = result.replace("가니쉬", "Garnish");
  result = result.replace("유리제품", "Glassware");
  result = result.replace("준비", "Preparation");
  result = result.replace('"참고: "', '"참고": ""');
  result = result.replace("참고", "Notes");
  return JSON.parse(`{${result}}`);
}

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto("https://papago.naver.com/");

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  await delay(3000);

  const start = 0;
  const end = 10;
  const currentData = getData(start, end);

  for (let i = 0; i < currentData.length; i++) {
    const index = start + i;
    try {
      const nowItem = currentData[i];
      const stringifiedText = JSON.stringify(nowItem, null, 2).replaceAll(
        `""`,
        `"null"`
      );

      await page.type(
        "#txtSource",
        stringifiedText.slice(1, stringifiedText.length - 1)
      );

      const searchResultSelector = "#btnTranslate";
      await page.waitForSelector(searchResultSelector);
      await page.click(searchResultSelector);

      await delay(3000);

      const translatedText = await page.evaluate(() => {
        const result = document.querySelector("#txtTarget").innerHTML;
        document.getElementById("txtSource").value = "";
        return result;
      });

      const item = translatedTextToJson(translatedText, index);
      resultJson.push(item);
    } catch (error) {
      console.log(`index ${index} : ${error}`);
    }
  }

  fs.writeFileSync("./result.json", JSON.stringify(resultJson));
  await browser.close();
})();
