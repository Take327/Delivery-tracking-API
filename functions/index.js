const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

/**
 * レスポンス用オブジェクト生成
 */

let responseObject = {
    meta: {
        code: null,                     //httpレスポンスステータスコード
        type: null,                     //httpレスポンスステータスタイプ
        message: null,                  //httpレスポンスメッセージ
    },
    data: {
        tracking_number: null,          //追跡番号
        delivery_carrier_code: null,    //配送業者
        package_type: null,             //荷物種類
        package_size: null,             //荷物サイズ
        scheduled_date: null,           //お届け予定日
        specified_date: null,            //お届け指定日
        specified_time: null,            //お届け指定時間
        tracking_info: {}               //追跡情報
    }
};


/**
 * 日本郵便追跡情報取得用の非同期処理
 * @param {string} requestNo
 * @returns string --createTrakingInfo関数にて成形されたJsonデータをreturnします。
 */
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

function createTrakingInfo(jpTrackingInfo, deliveryCarrierCode) {
    if (deliveryCarrierCode == 'JP') {
        //JP追跡情報成形
        const obj = {}
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
    }
}



/**
 * delivery_carrier_codeチェック関数
 * @param {object} request 
 * @returns boolean
 */
function requestDeliveryCarrierCodeCheck(request) {
    if (!request.query.delivery_carrier_code) {
        //delivery_carrier_codeが設定されていない
        noDeliveryCarrierCode();
        return false;
    } else if (!deliveryCarrierCodeMatchCheck(request.query.delivery_carrier_code)) {
        //delivery_carrier_codeが無効な値
        invalidDeliveryCarrierCode();
        return false;
    } else {
        return true;
    }
}

/**
 * delivery_carrier_code一致確認
 * @param {string} requestCarrier
 * @returns boolean 
 */
function deliveryCarrierCodeMatchCheck(requestCarrier) {
    const deliveryCarrierList = ['JP', 'Yamato', 'Sagawa'];
    if (deliveryCarrierList.includes(requestCarrier)) {
        return true;
    } else {
        return false;
    }
}

/**
 * tracking_numberチェック関数
 * @param {object} request 
 * @returns boolean
 */
function requestTrackingNumberCheck(request) {
    if (!request.query.tracking_number) {
        //tracking_numberが設定されていない
        noTrackingNumber();
        return false;
    } else if (!trackingNumberMatchCheck(request.query.tracking_number)) {
        //tracking_numberが無効な値
        invalidTrackingNumber();
        return false;
    } else {
        return true;
    }

}
/**
 * tracking_number一致確認
 * @param {string} trackingNumber 
 */
function trackingNumberMatchCheck(trackingNumber) {
    //正規表現パターン
    const regex = new RegExp(/^[0-9\-]+$/);
    if (regex.test(trackingNumber)) {
        return true;
    } else {
        return false;
    }
}


/**
 * delivery_carrier_codeが設定されていない場合のオブジェクト更新
 * @returns void
 * code:4001
 */
function noDeliveryCarrierCode() {
    responseObject.meta.code = 4001;
    responseObject.meta.type = 'Bad Request';
    responseObject.meta.message = 'delivery_carrier_code is not set.';
}

/**
 * tracking_numberが設定されていない場合のオブジェクト更新
 * @returns void
 * code:4002
 */
function noTrackingNumber() {
    responseObject.meta.code = 4002;
    responseObject.meta.type = 'Bad Request';
    responseObject.meta.message = 'tracking_number is not set.';
}

/**
 * delivery_carrier_codeが無効な値の場合のオブジェクト更新
 * @returns void
 * code:4003
 */
function invalidDeliveryCarrierCode() {
    responseObject.meta.code = 4003;
    responseObject.meta.type = 'Bad Request';
    responseObject.meta.message = 'invalid delivery_carrier_code';
}

/**
 * tracking_numberが無効な値の場合のオブジェクト更新
 * @returns void
 * code:4004
 */
function invalidTrackingNumber() {
    responseObject.meta.code = 4004;
    responseObject.meta.type = 'Bad Request';
    responseObject.meta.message = 'invalid tracking_number';
}


/**
 * の処理
 * @returns boulean
 * responseObjectのmetaオブジェクトを更新します。
 */
function mainControl(request) {
    if (!requestDeliveryCarrierCodeCheck(request)) {
        //delivery_carrier_codeチェックNG
        return false;
    } else {
        if (!requestTrackingNumberCheck(request)) {
            //tracking_numberチェックNF
            return false;
        } else {
            return true;
        }
    }

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

    if (mainControl(request)) {
        console.log(request);
        getTrackingInfoJapanPost(request.query.tracking_number).then(r => {
            response.send(`${JSON.stringify(r)}`);
        }, e => {
            response.send(`エラーだよ`);
        });
    } else {
        response.send(`${JSON.stringify(responseObject)}`);
    }

});

