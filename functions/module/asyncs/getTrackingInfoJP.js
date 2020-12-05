const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

/**
 * 日本郵便追跡情報取得用の非同期処理
 * @param {string} trackingNumber
 * @returns string --createTrakingInfo関数にて成形されたJsonデータをreturnします。
 */

module.exports = async (responseObject, trackingNumber) => {
    const result = responseObject;

    const res = await fetch(`https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${trackingNumber}&search.x=97&search`);
    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const nodes = document.querySelectorAll('.tableType01.txt_c.m_b5:nth-of-type(2) tr:nth-of-type(n+2) td');
    const jpTrackingInfo = Array.from(nodes).map(td => td.textContent.trim());

    const data = createTrakingInfoJP(jpTrackingInfo);
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
};


/**
 * domデータを成形しオブジェクトに格納する。
 * @param {string} jpTrackingInfo 
 */
const createTrakingInfoJP = (jpTrackingInfo) => {
    const tracking_info = [];
    for (let i = 0, row = 1; jpTrackingInfo.length > i; i += 6, row++) {
        tracking_info.push({
            date: jpTrackingInfo[i],
            state: jpTrackingInfo[i + 1],
            details: jpTrackingInfo[i + 2],
            office: jpTrackingInfo[i + 3],
            prefecture: jpTrackingInfo[i + 4],
            postnumber: jpTrackingInfo[i + 5]
        });
    }
    return tracking_info;
}

