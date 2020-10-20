//import fetch from 'node-fetch';
//import jsdom from 'jsdom'

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;



async function getTrackingInfo(requestNo) {
    const res = await fetch(`https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${requestNo}&search.x=97&search.y=18&startingUrlPatten=&locale=ja`);
    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const nodes = document.querySelectorAll('.tableType01.txt_c.m_b5:nth-of-type(2) tr:nth-of-type(n+2) td');
    const tokyoWeathers = Array.from(nodes).map(td => td.textContent.trim());
    const result = createTrakingInfo(tokyoWeathers);
    return result;

};

function createTrakingInfo(tokyoWeathers) {
    const obj = {}
    for (let i = 0, row = 1; tokyoWeathers.length > i; i += 6, row++) {
        obj[`row${row}`] = { data: tokyoWeathers[i], state: tokyoWeathers[i + 1], details: tokyoWeathers[i + 2], office: tokyoWeathers[i + 3], prefecture: tokyoWeathers[i + 4], postnumber: tokyoWeathers[i + 5] };
    }
    return JSON.stringify(obj)
}




// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.getTrackingJson = functions.https.onRequest((request, response) => {
    response.set('Access-Control-Allow-Origin', '*'); // localhostを許可
    response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST'); // DELETEだけは拒否
    response.set('Access-Control-Allow-Headers', 'Content-Type'); // Content-Typeのみを許可
    const trigger = getTrackingInfo(request.query.requestNo).then(r => {
        response.send(`${r}`);
    }, e => {
        response.send(`エラーだよ`);
    });

});

/*
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send('ハロー');
});
*/
