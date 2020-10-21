const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

//レスポンス用オブジェクト生成
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
        tracking_info: []                //追跡情報
    }
};

async function getTrackingInfoJapanPost(requestNo) {
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



//delivery_carrier_codeチェック関数
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

//delivery_carrier_code一致確認
function deliveryCarrierCodeMatchCheck(requestCarrier) {
    const deliveryCarrierList = ['JP', 'Yamato', 'Sagawa'];
    if (deliveryCarrierList.includes(requestCarrier)) {
        return true;
    } else {
        return false;
    }
}

//delivery_carrier_codeが設定されていない場合のオブジェクト更新
function noDeliveryCarrierCode() {
    responseObject.meta.code = 4001;
    responseObject.meta.type = 'Bad Request';
    responseObject.meta.message = 'delivery_carrier_code is not set.';
}

//delivery_carrier_codeが無効な値の場合のオブジェクト更新
function invalidDeliveryCarrierCode() {
    responseObject.meta.code = 4003;
    responseObject.meta.type = 'Bad Request';
    responseObject.meta.message = 'invalid delivery_carrier_code';
}




function mainControl(request) {

    if (!requestDeliveryCarrierCodeCheck(request)) {
        //delivery_carrier_codeチェックNG
        return false;
    } else {
        return true;
    }




}


exports.getTrackingJson = functions.https.onRequest((request, response) => {
    response.set('Access-Control-Allow-Origin', '*'); // すべて許可
    response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST'); // DELETEだけは拒否
    response.set('Access-Control-Allow-Headers', 'Content-Type'); // Content-Typeのみを許可

    if (mainControl(request)) {
        getTrackingInfoJapanPost(request.query.requestNo).then(r => {
            response.send(`${r}`);
        }, e => {
            response.send(`エラーだよ`);
        });
    } else {
        response.send(`${JSON.stringify(responseObject)}`);
    }

});

