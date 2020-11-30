const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const requestCheck = require('./module/requestchecker.js');//リクエストチェック用関数
const metaSetControl = require('./module/setmeta.js');//メタオブジェクトセット用関数

//レスポンス用オブジェクト

const responseObject = {
    meta: {},
    data: {
        tracking_number: null,          //追跡番号
        delivery_carrier_code: null,    //配送業者
        package_type: null,             //荷物種類
        package_size: null,             //荷物サイズ
        scheduled_date: null,           //お届け予定日
        specified_date: null,           //お届け指定日
        specified_time: null,           //お届け指定時間
        tracking_info: {}               //追跡情報
    }
};


/**
 * 日本郵便追跡情報取得用の非同期処理
 * @param {string} requestNo
 * @returns string --createTrakingInfo関数にて成形されたJsonデータをreturnします。
 */

 /*
async function getTrackingInfoJapanPost(requestNo) {
    const res = await fetch(`https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${requestNo}&search.x=97&search.y=18&startingUrlPatten=&locale=ja`);
    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const nodes = document.querySelectorAll('.tableType01.txt_c.m_b5:nth-of-type(2) tr:nth-of-type(n+2) td');
    const jpTrackingInfo = Array.from(nodes).map(td => td.textContent.trim());
    const result = createTrakingInfo(jpTrackingInfo, 'JP');
    return result;

};
*/

/**
 * domデータを成形しオブジェクトに格納する。
 * @param {string} jpTrackingInfo 
 * @param {string} deliveryCarrierCode 
 */

 /*
function createTrakingInfo(jpTrackingInfo, deliveryCarrierCode) {
    if (deliveryCarrierCode == 'JP') {
        //JP追跡情報成形
        for (let i = 0, row = 1; jpTrackingInfo.length > i; i += 6, row++) {
            responseObject.data.tracking_info[`row${row}`] = {
                data: jpTrackingInfo[i],
                state: jpTrackingInfo[i + 1],
                details: jpTrackingInfo[i + 2],
                office: jpTrackingInfo[i + 3],
                prefecture: jpTrackingInfo[i + 4],
                postnumber: jpTrackingInfo[i + 5]
            };
        }
        return responseObject
    } else if (deliveryCarrierCode == 'Yamato') {
        //Yamato追跡情報成形
    } else {
        //Sagawa追跡情報成形
    }
}
*/







/**
 * の処理
 * @returns boulean
 * responseObjectのmetaオブジェクトを更新します。
 */
const mainControl = (request) => {

    //リクエスト内容のチェックを行う
    const metaCode = requestCheck(request);

    //メタコードでオブジェクトを更新する
    responseObject.meta = metaSetControl(metaCode);

}


/**
 * cloud functionsの処理
 * @returns void
 * 
 */

exports.getTrackingJson = functions.https.onRequest((request, response) => {
    response.set('Access-Control-Allow-Origin', '*'); // すべて許可
    response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST'); // DELETEだけは拒否
    response.set('Access-Control-Allow-Headers', 'Content-Type'); // Content-Typeのみを許可

    mainControl(request);

    response.send(`${JSON.stringify(responseObject)}`);

    /*
        if (mainControl(request)) {
            getTrackingInfoJapanPost(request.query.tracking_number).then(r => {
                response.send(`${JSON.stringify(r)}`);
            }, e => {
                response.send(`エラーだよ`);
            });
        } else {
            response.send(`${JSON.stringify(responseObject)}`);
        }
    */

});

