require('dotenv').config();
const StudienetScrapper = require('./studienet-scrapper');
const fetchAndSave = require('./file-downloader');

async function main() {
    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;
    const dest = process.env.DEST;

    const studienetScrapper = await new StudienetScrapper(username, password);

    const cookie = await studienetScrapper.getCookie();
    const classes = await studienetScrapper.getClasses();

    for (let i = 0; i < classes.length; i++) {
        console.log(`Scrapping materials urls for: ${classes[i].name}`);
        let materials = await studienetScrapper.getClassMaterials(classes[i].url);
        console.log(`Total materials for ${materials.length} : ${classes[i].name}`);

        for (let j = 0; j < materials.length; j++) {
            console.log(`Fetching file ${materials[j]}`);
            try {
                const path = `${dest}/${classes[i].name}`;
                await fetchAndSave(materials[j], cookie, path);
            } catch (e) {
                console.error(e);;
                console.log(`Error while fetching and saving ${materials[j]}`);
            }
            console.log(`File ${materials[j]} succesfully fetched and saved - ${dest}/${classes[i].name}`);
        }
    }
    await studienetScrapper.shutDown();
}

main();