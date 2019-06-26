const fetch = require('node-fetch');
const fs = require('fs');

/**
 * 
 * @param {string} url 
 * @param {string} cookie 
 * @returns {Object} http response
 */
async function fetchFile(url, cookie) {
    const opts = {
        headers: {
            cookie: cookie
        }
    }
    return await fetch(url, opts);
}

/**
 * 
 * @param {Object} response (Http response)
 * @param {string} dest 
 * @param {string} fileName 
 */
function save(response, dest, fileName){
    if (!fs.existsSync(dest)){
        fs.mkdirSync(dest);
    }
    const file = fs.createWriteStream(`${dest}/${fileName}`);
    response.body.pipe(file);
}

function extractFileName(fileUrl){
    const urlParts = fileUrl.split('/');
    return urlParts[urlParts.length - 1];
}

async function fetchAndSave(url, cookie, dest) {
    const response = await fetchFile(url, cookie);
    save(response,dest, extractFileName(url));
}

module.exports = fetchAndSave;