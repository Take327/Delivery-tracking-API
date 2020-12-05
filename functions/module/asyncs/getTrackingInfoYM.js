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
    const nodes = document.querySelectorAll('.meisai tbody tr:nth-child(n + 2) td');
    const trackingInfoYM = Array.from(nodes).map(td => td.textContent);
    const data = createTrakingInfoYM(trackingInfoYM);
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
const createTrakingInfoYM = (trackingInfo) => {
    const tracking_info = [];
    for (let i = 0, row = 1; trackingInfo.length > i; i += 6, row++) {
        tracking_info.push({
            date: trackingInfo[i + 2] + ' ' + trackingInfo[i + 3],
            state: trackingInfo[i + 1],
            office: trackingInfo[i + 4],
        });
    }
    return tracking_info;
}