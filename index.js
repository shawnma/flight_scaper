const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPad Pro landscape'];

const LOOKUP = {
  origin: 'SFO',
  dest: 'YVR',
  datetime: '2020-05-08T12:00',
  flight: 'WS1258'
};

void (async () => {
  let j = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.emulate(iPhone);
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (url.indexOf("/bookingservices/flightSearch") > 0) {
      console.log(request.headers());
      const headers = {
        ...request.headers(),
        // This is basically replay attack. Not sure how long it will work. Otherwise we'll have to figure out how
        // they detect that chrome is running in "debug mode".
        'x-lov30h0l-a': 'KkeC=qfpS8HI7K=2q4kaslQkF1a003RCv8f-wUpQ-5IxgPSh65ektujMxH3Z6pwg-cG93riCdHa5HdvRh_xxm4_UAHXw' +
          '4um4kuvTDA2Vs4ihtSzs5ABgLkT6jU1ZbBOC2OP32ABxFOgsCSltztwbDZ8oiP8rCfmM53Sj=abE3XLvKhHDTVhtJ8WgpL5O_rG0nKVjNG' +
          'oEuEV4UPKoHHLEhvoQb-kxEPrtlfLAt77st8k5YtvNajL8p_NEic3mM18bOpsbhIHfjkH_q2lkzvIWHMSUobpdA1zMUFQeOQsKBcUG4gKX' +
          'bt23rriwnNlJ8rYrEod=8GO7f8KFYXMlibxn81uoTbiW9YnlEKPSOTFYTOj30Uq=GfJZCVwB1UbOAjBM=NHBi0Mrjv1S9S-h=48z7o3Cqi' +
          'e-FQZ6G4Wt0uYibk3AcPeJOT7Oee2=81KiL-JNKT2ZD5xoYz22KDXpH39FAm5n4p5JXhAK8YNrrNF2uLrJTvV-uBwNsC6RHDWb9=1N_paI' +
          'tVG0nn-QrzQLR36mRNO=0cBqTp5R2tk4E4PUTWv84s84TQHUgme4AuQY50W82UTX-Wm003uRW-NKlm=5kO6G0Lvix_MCpWkX5AaECWaQMp' +
          'c4gCeNAkFxKfPxkvgZBjCG=ldc0GwohrGHBiepa2bZqrW4VKm_sl=uGYiTea0NUEdkxwmuG2p1A_X1mUNs7p8peoFOP2eY3RgOcfFuOxRB' +
          '4LJ0VY633-3VmFCUqMi1N7WOZzm0XTbCz49bK9_Z6-kOdgtCsgle0kXVMlWpR0aHE7-2aD2KqQAwA7TdDU_mhUfHqNd7EXraS3nJeGKUDr' +
          'rluehvuBHODb8SWhDCzItS07YkAmJloePBnNc0zq7H2cPoXHzdUCDAjCorfWqCxMpcu8FNRE6GsuS3GwA=vpPHijAADTCRzLGa_G4b2Ldj' +
          'mR0CZsBeJS-jwKJ5dea-6QcZSoHpRTVh80CelFRVT6bP9GAdgYSO0kZFvAG1qVVV3QRp57ffp3ehVBX3fmIJXd53_6YL2G9YWMO8rCM-C0' +
          'YHKTEUFE-bzhmaganFkMoJg7E2CgWQvkwC9Vn_DUmYxzB0mOF7-6cz68I1l-5ii2jnV1AFwlI8HNn=mvR0nneFE3MtRPsar=SSiSNeakRW' +
          'PaTUmG8xKnb7VHxp25fM_o9FNarU36Wbc=0bl3Qh2_81uiK_qCXo5o5zu65cS8PGiquH2loMxUhaaOKqPXrxlznfhhP2o-z3sr79M9jIqI' +
          'W1DUjO1mf7_orlQOWBoSOw-QHRrqNqd0B74bmJNB6DEH-RpPEPGjASTuPCrhFBXt1sEnu=ROCbfGbeOpD4hkYZnRnCTsLvvO6dc5rrCniD' +
          'Smv8fLFvP9DbLv4fvBt3QKg_X0r5kET-b3sksvxoTRJ7nKdV1DTlGS_PkKbDr1ngDNEk6sLH3cG=NXdB5bSwXDE9wUik-U_LbtTwzTvS_E' +
          'xYijWoI9sDjsJiL1zpvRUt8J2Db88a9guxMN1E-WNEw1KAZM=Y8iDc5ZBVL7MKVMLGRdPuAC=nrAuX7Utmk-5tt=z6pu3qEB8tFWB8gnl5' +
          'xO6ObNWYGUXSFPhI07_3p-zPc3dJJdnFDhmLdgQlH5sCBApbNzQrmfKAqj2ZdLozPurIBGj6vW26EXzrf9-6NMfsAZNX94_rQJ2aNnO4XP' +
          'ueiAjqHXY3Fv0Zi7RRUgUahzb_FaES4=iAhqk0iKTg029-fs2aAF1jRhS9D6x0MxAV4rJ=geSNavTWNlt',
        'x-lov30h0l-b': '-hfwvo',
        'x-lov30h0l-c': 'AMD_NfNvAQAA9bIbMw7nVqZeg-NPyS2e_WyMwuftxRFul_VvpKDM4IjmeyoL',
        'x-lov30h0l-f': 'Azb-QfNvAQAAqQQSAC0o5RTJW2RCFdnG3ojityqswVA7Sl4V4Gmj1gpEtmHmAa4-SdGuchShwH8AAOfvAAAAAA=='
      };
      request.continue({headers});
      console.log(headers);
    } else {
      request.continue();
    }
  });
  let matchingFlight = null;
  page.on('response', async response => {
    if (response.url().indexOf("/bookingservice/flightSearch") > 0 && response.ok()) {
      const json = await response.json();
      const options = json['flights'][0]['flightOptions'];
      options.forEach(option => {
        const flight = option['flightDetails']['flightSegments'];
        if (flight.length === 1 && (flight[0]['marketingAirline'] + flight[0]['flightNumber']) === LOOKUP.flight) {
          matchingFlight = flight[0];
        }
      });
    }
  });
  const date = LOOKUP.datetime.split("T")[0];
  let shop = `https://www.westjet.com/shop/?lang=en&type=search&origin=${LOOKUP.origin}&destination=${LOOKUP.dest}&adults=1&children=0&infants=0&outboundDate=${date}&returnDate=&companionvoucher=false&iswestjetdollars=false&promo=&currency=USD&caller=https%3A%2F%2Fwww.westjet.com%2Fen-us%2Findex`;
  console.log(shop);
  await page.goto(shop);
  console.log(matchingFlight);
})();