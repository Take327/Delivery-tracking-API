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

    //追跡情報Tableデータを取得
    const historyTable = document.querySelectorAll('.table_basic.table_okurijo_detail2:nth-of-type(2) tr:nth-child(n + 2) td');

    //NodeListをArrayに変換&併せてブランクを除外
    const historyArray = Array.from(historyTable).map(td => td.textContent.trim());


    if (historyArray.length === 0) {
        const meta = {
            code: 4017,                                 //httpレスポンスステータスコード
            type: 'Bad Request',                        //httpレスポンスステータスタイプ
            message: 'Tracking does not exist.',        //httpレスポンスメッセージ
        }
        result.meta = meta;
    } else {
        const data = createTrakingInfoSG(historyArray);
        result.data = data;
    }

    return result;
}


/**
 * domデータを成形しオブジェクトに格納する。
 * @param {string} historyArray 
 */
const createTrakingInfoSG = (historyArray) => {
    let data = {
        trackingHistory: {
            lastHistory: {},
            historys: []
        },
        commonTrackingHistory: {
            lastHistory: {},
            historys: []
        }
    }

    for (let i = 0, row = 0; historyArray.length > i; i += 3, row++) {
        const statusCode = getStatusCode(historyArray[i].substr(1));

        data.trackingHistory.historys.push({
            row: row + 1,
            date: historyArray[i + 1],
            statusCode: statusCode,
            statusText: historyArray[i].substr(1),
            office: historyArray[i + 2],
        });

        data.commonTrackingHistory.historys.push({
            row: row + 1,
            date: historyArray[i + 1],
            statusCode: statusCode,
            office: historyArray[i + 2],
        });

        data.trackingHistory.lastHistory = data.trackingHistory.historys[row];
        data.commonTrackingHistory.lastHistory = data.commonTrackingHistory.historys[row];

    }

    return data;
}

const getStatusCode = (statusText) => {
    const statusCodes = {
        startCode: '集荷',
        absenceCode: 'ご不在',
        goleCode: '配達完了',
        returnCode: '返品完了'
    }

    switch (statusText) {
        case statusCodes.startCode:
            return 'start';
        case statusCodes.absenceCode:
            return 'absence';
        case statusCodes.goleCode:
            return 'gole';
        case statusCodes.returnCode:
            return 'return';
        default:
            return 'relay';
    }
}