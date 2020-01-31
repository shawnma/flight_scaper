const puppeteer = require('puppeteer');
const device = puppeteer.devices['iPad Pro landscape'];

const LOOKUP = {
  origin: 'SFO',
  dest: 'YVR',
  datetime: '2020-05-08T12:00',
  flight: 'WS1775'
};

function defer() {
  let deferred = {};
  deferred.promise = new Promise(function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}

void (async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.emulate(device);
  await page.evaluate("delete window['webdriver']");
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });
  let flighResultPromise = defer();
  let matchingFlight = null;
  page.on('response', async response => {
      if (response.url().indexOf("/bookingservices/flightSearch") > 0 && response.ok()) {
      try {
        const json = await response.json();
        const options = json['flights'][0]['flightOptions'];
        let found = false;
        options.forEach(option => {
          const flight = option['flightDetails']['flightSegments'];
          if (flight.length === 1 && (flight[0]['marketingAirline'] + flight[0]['flightNumber']) === LOOKUP.flight) {
            matchingFlight = flight[0];
            flighResultPromise.resolve();
            found = true;
          }
        });
        if (!found) {
          flighResultPromise.reject("Unable to find the flight")
        }
      } catch (e) {
        flighResultPromise.reject(e);
      }
    }
  });
  const date = LOOKUP.datetime.split("T")[0];
  let shop = `https://www.westjet.com/shop/?lang=en&type=search&origin=${LOOKUP.origin}&destination=${LOOKUP.dest}&adults=1&children=0&infants=0&outboundDate=${date}&returnDate=&companionvoucher=false&iswestjetdollars=false&promo=&currency=USD&caller=https%3A%2F%2Fwww.westjet.com%2Fen-us%2Findex`;
  console.log(shop);
  await page.goto(shop);
  try {
    await flighResultPromise.promise;
  } catch (e) {
    console.log(e);
  }
  console.log(matchingFlight);
})();