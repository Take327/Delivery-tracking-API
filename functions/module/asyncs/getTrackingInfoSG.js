const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

/**
 * 佐川急便追跡情報取得用の非同期通信
 * @param {string} trackingNumber 
 */
module.exports = async (responseObject, trackingNumber) => {
    const result = responseObject;

    const res = await fetch(`http://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${trackingNumber}`);
    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const nodes = document.querySelectorAll('.table_basic.table_okurijo_detail2:nth-of-type(2) tr:nth-child(n + 2) td');
    const trackingInfoSG = Array.from(nodes).map(td => td.textContent.trim());
    const data = createTrakingInfoSG(trackingInfoSG);
    
    if (data.length === 0) {
        const meta = {
            code: 4017,                                 //httpレスポンスステータスコード
            type: 'Bad Request',                        //httpレスポンスステータスタイプ
            message: 'Tracking does not exist.',        //httpレスポンスメッセージ
        }

        result.meta = meta;
    } else {
        result.data = data;
    }

    return result;
}


/**
 * domデータを成形しオブジェクトに格納する。
 * @param {string} trackingInfo 
 */
const createTrakingInfoSG = (trackingInfo) => {
    const tracking_info = [];
    for (let i = 0, row = 1; trackingInfo.length > i; i += 3, row++) {
        tracking_info.push({
            date: trackingInfo[i + 1],
            state: trackingInfo[i].substr(1),
            office: trackingInfo[i + 2],
        });
    }
    return tracking_info;
}