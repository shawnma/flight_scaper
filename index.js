const puppeteer = require('puppeteer');
const device = puppeteer.devices['iPad Pro landscape'];

const LOOKUP = {
  origin: 'SFO',
  dest: 'YVR',
  datetime: '2020-08-07T12:00',
  flight: 'WS1775'
};

function extractedBookId(searchResponse) {
  const bid = /bookId=([0-9\-]*)/.exec(searchResponse.url());
  if (!bid || bid.length <= 1) {
    throw new Error("unable to find book id");
  }
  return bid[1];
}

function debug(s) {
  if (true) {
    console.log(s);
  }
}

async function extractFlight(searchResponse) {
  debug("extractFlight");
  const searchJson = searchResponse; //await searchResponse.json();
  debug("Got JSON");
  const options = searchJson['flights'][0]['flightOptions'];
  let matchingFlight = null;
  options.forEach((option) => {
    const segment = option['flightDetails']['flightSegments'];
    if (segment.length === 1
      && (segment[0]['marketingAirline'] + segment[0]['flightNumber']) === LOOKUP.flight) {
      // && segment[0].departureDateRaw.startsWith(LOOKUP.datetime)
      matchingFlight = segment[0];
    }
  });
  return matchingFlight;
}

function encodeSeatsUrl(matchingFlight, bookId) {
  const flight = encodeURI(JSON.stringify([{
    flight: [{
      "fareClass": "E",
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

  let pageListeners = {};
  page.on('response', async response => {
    debug("got response " + response.url());
    for (const url in pageListeners) {
      if (response.url().indexOf(url) > 0) {
        debug(response.status());
        debug(response.url());
        const json = await response.json();
        pageListeners[url](json, response);
        break;
      }
    }
  });

  function t(url) {
    let resolveCallback, rejectCallback;
    pageListeners[url] = function (json, response) {
      resolveCallback([json, response]);
    };
    return new Promise((resolve, reject) => {
      resolveCallback = resolve;
      rejectCallback = reject;
    });
  }

  const date = LOOKUP.datetime.split("T")[0];
  let shop = `https://www.westjet.com/shop/?lang=en&type=search&origin=${LOOKUP.origin}&destination=${LOOKUP.dest}&adults=1&children=0&infants=0&outboundDate=${date}&returnDate=&companionvoucher=false&iswestjetdollars=false&promo=&currency=USD&caller=https%3A%2F%2Fwww.westjet.com%2Fen-us%2Findex`;
  const searchPromise = t("/bookingservices/flightSearch");
  await page.goto(shop);
  const searchResponse = await searchPromise;// page.waitForResponse(r => r.url().indexOf("/bookingservices/flightSearch") > 0, 3000);

  const bookId = extractedBookId(searchResponse[1]);
  debug(bookId);
  const matchingFlight = await extractFlight(searchResponse[0]);
  if (matchingFlight == null) {
    console.log("Unable to find flight");
    return;
  }
  debug(matchingFlight);
  const seatsPromise = page.goto(encodeSeatsUrl(matchingFlight, bookId));
  const resp = await page.waitForResponse(r => r.url().indexOf("/extendedSeatmap") > 0, 3000);
  const json = await resp.json();
  json.aircraft.deck.cabin.rows.forEach(row => {
    let info = ("" + row.rowNumber).padStart(2, ' ') + "   "
      + row.seats.map(s =>
        (s.seatNumber + " " + ((s.characteristics.NO_SEAT || s.characteristics.OFFERED_LAST) ? "---" : s.prices[0]['price'])).padStart(15, ' ')
      ).join(" ");
    console.log(info);
  });
  await seatsPromise;
  await browser.close();
})();