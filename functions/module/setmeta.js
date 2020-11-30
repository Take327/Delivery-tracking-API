
/**
 * リクエストが成功した際のオブジェクト更新
 * @returns void
 * code:200
 */
const setSuccessMeta = (responseObject) => {
    responseObject.code = 200;
    responseObject.type = 'Success';
    responseObject.message = 'The request was successful.';
}

/**
 * delivery_carrier_codeが設定されていない場合のオブジェクト更新
 * @returns void
 * code:4001
 */
const noDeliveryCarrierCode = (responseObject) => {
    responseObject.code = 4001;
    responseObject.type = 'Bad Request';
    responseObject.message = 'delivery_carrier_code is not set.';
}

/**
 * tracking_numberが設定されていない場合のオブジェクト更新
 * @returns void
 * code:4002
 */
const noTrackingNumber = (responseObject) => {
    responseObject.code = 4002;
    responseObject.type = 'Bad Request';
    responseObject.message = 'tracking_number is not set.';
}

/**
 * delivery_carrier_codeが無効な値の場合のオブジェクト更新
 * @returns void
 * code:4003
 */
const invalidDeliveryCarrierCode = (responseObject) => {
    responseObject.code = 4003;
    responseObject.type = 'Bad Request';
    responseObject.message = 'invalid delivery_carrier_code';
}

/**
 * tracking_numberが無効な値の場合のオブジェクト更新
 * @returns void
 * code:4004
 */
const invalidTrackingNumber = (responseObject) => {
    responseObject.code = 4004;
    responseObject.type = 'Bad Request';
    responseObject.message = 'invalid tracking_number';
}

module.exports = (metaCode) => {
    const metaObject = {
        code: null,                     //httpレスポンスステータスコード
        type: null,                     //httpレスポンスステータスタイプ
        message: null,                  //httpレスポンスメッセージ
    };

    switch (metaCode) {
        case 200:
            setSuccessMeta(metaObject);
            break;

        case 4001:
            noDeliveryCarrierCode(metaObject);
            break;

        case 4002:
            noTrackingNumber(metaObject);
            break;

        case 4003:
            invalidDeliveryCarrierCode(metaObject);
            break;

        case 4004:
            invalidTrackingNumber(metaObject);
            break;
    }

    return metaObject;
}
