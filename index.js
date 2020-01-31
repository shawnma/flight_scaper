const puppeteer = require('puppeteer');
const device = puppeteer.devices['iPad Pro landscape'];

const lookup = {
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
  if (false) {
    console.log(s);
  }
}

async function extractFlight(searchResponse) {
  debug("extractFlight");
  const searchJson = await searchResponse.json();
  debug("Got JSON");
  const options = searchJson['flights'][0]['flightOptions'];
  let matchingFlight = null;
  options.forEach((option) => {
    const segment = option['flightDetails']['flightSegments'];
    if (segment.length === 1
      && (segment[0]['marketingAirline'] + segment[0]['flightNumber']) === lookup.flight) {
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
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.emulate(device);
  await page.evaluate("delete window['webdriver']");
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  const date = lookup.datetime.split("T")[0];
  let shop = `https://www.westjet.com/shop/?lang=en&type=search&origin=${lookup.origin}&destination=${lookup.dest}&adults=1&children=0&infants=0&outboundDate=${date}&returnDate=&companionvoucher=false&iswestjetdollars=false&promo=&currency=USD&caller=https%3A%2F%2Fwww.westjet.com%2Fen-us%2Findex`;
  await page.goto(shop);
  const searchResponse = await page.waitForResponse(r => r.url().indexOf("/bookingservices/flightSearch") > 0, 3000);
  const matchingFlight = await extractFlight(searchResponse);
  if (matchingFlight == null) {
    console.log("Unable to find flight");
    return;
  }
  debug(matchingFlight);
  const bookId = extractedBookId(searchResponse);
  debug(bookId);

  const seatsPromise = page.goto(encodeSeatsUrl(matchingFlight, bookId));
  const resp = await page.waitForResponse(r => r.url().indexOf("/extendedSeatmap") > 0, 3000);
  const json = await resp.json();
  const seatUnavailable = (s) => s.characteristics.NO_SEAT || s.characteristics.OFFERED_LAST || s.occuppied;
  json.aircraft.deck.cabin.rows.forEach(row => {
    let info = ("" + row.rowNumber).padStart(2, ' ') + "   "
      + row.seats.map(s => (s.seatNumber + " " + (seatUnavailable(s) ? "---" : s.prices[0]['price'])).padStart(15, ' ')).join(" ");
    console.log(info);
  });
  await seatsPromise;
  await browser.close();
})();