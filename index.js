const puppeteer = require('puppeteer');
const device = puppeteer.devices['iPad Pro landscape'];

const LOOKUP = {
  origin: 'SFO',
  dest: 'YVR',
  datetime: '2020-05-08T12:00',
  flight: 'WS1775'
};

function extractedBookId(searchResponse) {
  const bid = /bookId=([0-9\-]*)/.exec(searchResponse.url());
  if (!bid || bid.length <= 1) {
    throw new Error("unable to find book id");
  }
  return bid[1];
}

async function extractFlight(searchResponse) {
  const searchJson = await searchResponse.json();
  const options = searchJson['flights'][0]['flightOptions'];
  let matchingFlight = null;
  options.forEach((option) => {
    const flight = option['flightDetails']['flightSegments'];
    if (flight.length === 1 && (flight[0]['marketingAirline'] + flight[0]['flightNumber']) === LOOKUP.flight) {
      matchingFlight = flight[0];
    }
  });
  return matchingFlight;
}

function encodeSeatsUrl(matchingFlight, bookId) {
  const flight = encodeURI(JSON.stringify([{
    flight: [{
      "fareClass": "B",
      "flightNumber": matchingFlight.flightNumber,
      "airlineCodeOperating": matchingFlight.operatingAirline,
      "operatingFlightNumber": matchingFlight.operatingAirlineFlightNumber,
      "airlineCodeMarketing": matchingFlight.marketingAirline,
      "departureDateTime": matchingFlight.departureDateRaw,
      "arrivalDateTime": matchingFlight.arrivalDateRaw,
      "arrival": matchingFlight.destinationCode,
      "departure": matchingFlight.originCode
    }]
  }]));
  const passenger = encodeURI(JSON.stringify([{
    "passengerTitle": "MR",
    "dateOfBirth": "1990-09-10",
    "firstName": "james",
    "middleName": "",
    "lastName": "Town",
    "ageOfMajority": false,
    "gender": "Male",
    "loyaltyProgramName": "",
    "loyaltyProgramMemberId": "",
    "type": "adult",
    "displayIndex": 0,
    "perks": []
  }]));

  return `https://apiw.westjet.com/bookingservices/seatmap/extendedSeatmap?segment=1&flightInfo=${flight}&pointOfSale=QkFC&hasInfant=false&bookId=${bookId}&passengerInfo=${passenger}`;
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

  const date = LOOKUP.datetime.split("T")[0];
  let shop = `https://www.westjet.com/shop/?lang=en&type=search&origin=${LOOKUP.origin}&destination=${LOOKUP.dest}&adults=1&children=0&infants=0&outboundDate=${date}&returnDate=&companionvoucher=false&iswestjetdollars=false&promo=&currency=USD&caller=https%3A%2F%2Fwww.westjet.com%2Fen-us%2Findex`;
  const shopPromise = page.goto(shop);
  const searchResponse = await page.waitForResponse(r=>r.url().indexOf("/bookingservices/flightSearch") > 0 && r.ok());
  const bookId = extractedBookId(searchResponse);
  const matchingFlight = await extractFlight(searchResponse);
  console.log(matchingFlight);
  console.log(`book id = ${bookId}`);
  await shopPromise;

  const url = encodeSeatsUrl(matchingFlight, bookId);
  console.log(url);
  const pageLoad = page.goto(url);
  const resp = await page.waitForResponse(r => r.url().indexOf("/extendedSeatmap") > 0);
  const json = await resp.json();
  console.log(json);
  await pageLoad;
})();