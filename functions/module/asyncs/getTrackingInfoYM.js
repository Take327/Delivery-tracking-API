const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;


/**
 * ヤマト運輸追跡情報取得用の非同期通信
 * @param {string} trackingNumber 
 */
module.exports = async (responseObject, trackingNumber) => {
    const result = responseObject;

    const res = await fetch(`http://toi.kuronekoyamato.co.jp/cgi-bin/tneko`,
        {
            method: "POST",
            headers: {
                "Host": "toi.kuronekoyamato.co.jp",
                "Cache-Control": "max-age=0",
                "Content-Type": "application/x-www-form-urlencoded; charset=Shift_JIS"
            },
            body: `mypagesession=&backaddress=&backrequest=&number00=1&sch=%82%A8%96%E2%82%A2%8D%87%82%ED%82%B9%8AJ%8En&number01=${trackingNumber}`
        });

    const html = await res.arrayBuffer();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    //追跡情報Tableデータを取得
    const historyTable = document.querySelectorAll('.meisai tbody tr:nth-child(n + 2) td');

    //NodeListをArrayに変換&併せてブランクを除外
    const historyArray = Array.from(historyTable).map(td => td.textContent);


    if (historyArray.length === 0) {
        const meta = {
            code: 4017,                                 //httpレスポンスステータスコード
            type: 'Bad Request',                        //httpレスポンスステータスタイプ
            message: 'Tracking does not exist.',        //httpレスポンスメッセージ
        }
        result.meta = meta;
    } else {
        const data = createTrakingInfoYM(historyArray);
        result.data = data;
    }

    return result;
}

/**
 * domデータを成形しオブジェクトに格納する。
 * @param {string} historyArray 
 */
const createTrakingInfoYM = (historyArray) => {
    let data = {
        trackingHistory: {
            lastHistory: {},
            historys: []
        },
        commonTrackingHistory: {
            lastHistory: {},
            historys: []
        }
    };

    for (let i = 0, row = 0; historyArray.length > i; i += 6, row++) {
        const statusCode = getStatusCode(historyArray[i + 1]);

        data.trackingHistory.historys.push({
            row: row + 1,
            date: historyArray[i + 2],
            time: historyArray[i + 3],
            statusCode: statusCode,
            stateText: historyArray[i + 1],
            office: historyArray[i + 4],
            officeCode: historyArray[i + 5]
        });

        data.commonTrackingHistory.historys.push({
            row: row + 1,
            date: historyArray[i + 2] + ' ' + historyArray[i + 3],
            statusCode: statusCode,
            office: historyArray[i + 4],
        });

        data.trackingHistory.lastHistory = data.trackingHistory.historys[row];
        data.commonTrackingHistory.lastHistory = data.commonTrackingHistory.historys[row];
    }

    return data;
}

const getStatusCode = (statusText) => {
    const statusCodes = {
        startCode: '発送',
        absenceCode: '持戻（持ち戻り）',
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