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

    //追跡情報Tableデータを取得
    const historyTable = document.querySelectorAll('.tableType01.txt_c.m_b5:nth-of-type(2) tr:nth-of-type(n+2) td');

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
        const data = createTrakingInfoJP(historyArray);
        result.data = data;
    }

    return result;
};


/**
 * domデータを成形しオブジェクトに格納する。
 * @param {string} historyArray 
 */
const createTrakingInfoJP = (historyArray) => {
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

    for (let i = 0, row = 0; historyArray.length > i; i += 6, row++) {
        const statusCode = getStatusCode(historyArray[i + 1])

        data.trackingHistory.historys.push({
            row:row +1,
            date: historyArray[i],
            statusCode: statusCode,
            statusText: historyArray[i + 1],
            details: historyArray[i + 2],
            office: historyArray[i + 3],
            prefecture: historyArray[i + 4],
            postnumber: historyArray[i + 5]
        });

        data.commonTrackingHistory.historys.push({
            row:row +1,
            date: historyArray[i].slice(5),
            statusCode: statusCode,
            office: historyArray[i + 3]
        });

        data.trackingHistory.lastHistory = data.trackingHistory.historys[row];
        data.commonTrackingHistory.lastHistory = data.commonTrackingHistory.historys[row];

    }

    return data;
}


const getStatusCode = (statusText) => {
    const statusCodes = {
        startCode: '引受',
        absenceCode: 'ご不在のため持ち戻り',
        goleCode: 'お届け先にお届け済み',
        returnCode: '差出人に返送済み'
    };

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

