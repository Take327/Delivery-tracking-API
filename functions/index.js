const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const requestCheck = require('./module/requestchecker.js');                 //リクエストチェック用関数
const metaSetControl = require('./module/setmeta.js');                      //メタオブジェクトセット用関数
const getTrackingInfoJP = require('./module/asyncs/getTrackingInfoJP.js');
const getTrackingInfoSG = require('./module/asyncs/getTrackingInfoSG.js');
const getTrackingInfoYM = require('./module/asyncs/getTrackingInfoYM.js');

/**
 * cloud functionsの処理
 * @returns void
 * 
 */

exports.getTrackingJson = functions.https.onRequest((request, response) => {
    response.set('Access-Control-Allow-Origin', '*'); // すべて許可
    response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST'); // DELETEだけは拒否
    response.set('Access-Control-Allow-Headers', 'Content-Type'); // Content-Typeのみを許可

    const responseObject = {
        meta: {},
        data: {}
    };

    //リクエスト内容のチェックを行う
    const metaCode = requestCheck(request);

    //メタコードでオブジェクトを更新する
    responseObject.meta = metaSetControl(metaCode);

    if (metaCode === 200) {
        switch (request.query.delivery_carrier_code) {
            case 'JP':
                getTrackingInfoJP(responseObject, request.query.tracking_number).then((r) => response.send(JSON.stringify(r))).catch((r) => response.send('error'));
                break;
            case 'SG':
                getTrackingInfoSG(responseObject, request.query.tracking_number).then((r) => response.send(JSON.stringify(r))).catch((r) => response.send('error'));
                break;
            case 'YM':
                getTrackingInfoYM(responseObject, request.query.tracking_number).then((r) => response.send(JSON.stringify(r))).catch((r) => response.send('error'));
                break;
            default:
                response.send('error');
                break;
        }
    }else{
        response.send(responseObject);
    }
});

