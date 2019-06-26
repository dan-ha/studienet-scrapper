'use strict';
const puppeteer = require('puppeteer');

const VIA_HOMEPAGE = "https://studienet.via.dk";
const VIA_ALL_CLASSES = "https://studienet.via.dk/sites/uddannelse/ict/horsens/Pages/All_classes.aspx"

/**
 * Scrape studienet website for list of all classes
 * and links to their respective materials.
 * 
 * Basic usage:
 * username = student's username
 * password = corresponding password
 * 
 *  getClasses() - return array of classes
 *  getClassMaterials(classUrl) - return array of material urls for specified class
 *  getCookies - gets user specific cookies after login
 */
class StudienetScrapper {

  /**
   * let instance = await new StudienetScrapper(usr, pass);
   * @param {string} username 
   * @param {string} password 
   */
  constructor(username, password) {
    this.username = username;
    this.password = password;

    return (async () => {
      // await puppeteer.launch({ headless: false }); use for debbuging purposes
      this.browser = await puppeteer.launch();
      await this.login();
      return this;
    })();
  }

  /**
   * sideefect - session cookies are cached
   */
  async login() {
    const page = await this.openPage(VIA_HOMEPAGE);

    await page.type('#login', this.username);
    await page.type('#passwd', this.password);

    // click login button
    await page.click('#nsg-x1-logon-button');
    await page.waitForNavigation();

    await page.close();
  }

  /**
   * sideefect - cached cookies are removed(must be logged in again)
   */
  async logout() {
    // delete cookies
  }

  /**
   * @returns {Array<Object>} 
   *    name: name of the class
   *    url: corresponding url
   */
  async getClasses() {
    const page = await this.openPage(VIA_ALL_CLASSES);

    const classes = [];
    var tableClasses = await page.$$('#ctl00_ctl41_g_7e08e0cd_4020_4b4b_b9bd_1eb7c01e95f6_ctl00_gv1 tbody tr');
    for (let i = 0; i < tableClasses.length; i++) {
      let className = await tableClasses[i].$eval('a', anchor => anchor.innerHTML);
      let classUrl = await tableClasses[i].$eval('a', anchor => anchor.href);
      classes.push({
        name: className,
        url: classUrl
      });
    }
    await page.close();
    return classes;
  }

  /**
   * 
   * @param {string} classUrl 
   * @returns {Array<string>} list of material's urls
   */
  async getClassMaterials(classUrl) {
    const page = await this.openPage(`${classUrl}/Session Material`);
    const materials = await this.getMaterialsUrls(page);
    await page.close();
    return materials;
  }

  /**
   * Helper method to open page in new tab
   * @param {String} url 
   */
  async openPage(url) {
    const page = await this.browser.newPage();
    await page.goto(url, {
      waitUntil: ['load', 'domcontentloaded', 'networkidle0']
    });
    return page;
  }

  /**
   * Helper method to fetch all material's urls from given page
   * @param {Page} page 
   */
  async getMaterialsUrls(page) {
    const groups = await page.$$(`#scriptWPQ2 table [id^='tbod']`);
    let urls = [];
    for (let i = 0; i < groups.length; i++) {
      urls = urls.concat(await this.getMaterialGroupUrls(groups[i]));
    }
    return urls;
  }

  /**
   * Helper method to retrieve urls from given group
   * @param {ElementHandle} materialGroup 
   */
  async getMaterialGroupUrls(materialGroup) {
    const urls = [];
    var materialTrs = await materialGroup.$$('tr');
    for (let i = 0; i < materialTrs.length; i++) {
      let materialUrl = await materialTrs[i].$('td .ms-vb-title');
      urls.push(await materialUrl.$eval('a', anchor => anchor.href));
    }
    return urls;
  }

  /**
   * Return cookie in the format:
   * name=value;name=value;name=value;...
   */
  async getCookie() {
    const page = await this.openPage(VIA_HOMEPAGE);
    const cookies = await page.cookies();
    const cookie = cookies.reduce((previous, current) => {
      return previous + `${current.name}=${current.value};`;
    }, '');
    await page.close();
    return cookie;

  }

  async shutDown() {
    await this.browser.close();
  }

}
module.exports = StudienetScrapper;