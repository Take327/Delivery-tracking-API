const responseObject = {
    meta: {},
    data: {
        tracking_number: null,          //追跡番号
        delivery_carrier_code: null,    //配送業者
        package_type: null,             //荷物種類
        package_size: null,             //荷物サイズ
        scheduled_date: null,           //お届け予定日
        specified_date: null,           //お届け指定日
        specified_time: null,           //お届け指定時間
        tracking_info: {}               //追跡情報
    }
};

export default responseObject;