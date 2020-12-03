const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

/**
 * ヤマト運輸追跡情報取得用の非同期通信
 * @param {string} trackingNumber 
 */
const getTrackingInfoYM = async (trackingNumber) => {
    const res = await fetch(`http://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.NQ0010?id=${trackingNumber}`);
    const html = await res.text();
    console.log(html);
}