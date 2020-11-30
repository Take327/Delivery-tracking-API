/**
 * delivery_carrier_code一致確認
 * @param {string} requestCarrier
 * @returns boolean 
 */
const deliveryCarrierCodeMatchCheck = (requestCarrier) => {
    const deliveryCarrierList = ['JP', 'Yamato', 'Sagawa'];
    if (deliveryCarrierList.includes(requestCarrier)) {
        return true;
    } else {
        return false;
    }
}

/**
 * tracking_number一致確認
 * @param {string} trackingNumber 
 */
const trackingNumberMatchCheck = (trackingNumber) => {
    //正規表現パターン
    const regex = new RegExp(/^[0-9]+$/);
    if (regex.test(trackingNumber)) {
        return true;
    } else {
        return false;
    }
}


/**
 * リクエストをチェックする
 * @param {request} request 
 * return number metaCode
 */
module.exports = (request) => {
    //delivery_carrier_codeの有無確認
    if (request.query.delivery_carrier_code) {
        //delivery_carrier_codeが一致しているかの確認
        if (!deliveryCarrierCodeMatchCheck(request.query.delivery_carrier_code)) {
            //delivery_carrier_code不一致
            return 4003;
        }
    } else {
        //delivery_carrier_code未入力
        return 4001;
    }

    //tracking_numberの有無確認
    if (request.query.tracking_number) {
        //tracking_numberが一致しているかの確認
        if (!trackingNumberMatchCheck(request.query.tracking_number)) {
            //tracking_number不一致
            return 4004;
        }
    } else {
        return 4002;
    }

}