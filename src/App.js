import React, { useState, useEffect } from 'react';

const App = () => {
    const [deliveryCarrierCode, setDeliveryCarrierCode] = useState(null);
    const [trackingNumber, setTrackingNumber] = useState(null);
    const [resultJson, setResultJson] = useState(null);

    useEffect(() => {
        
    }, [resultJson]);

    const deliveryCarrierList = ['','JP', 'YM', 'SG'];

    const getjson = async () => {
        const url = `https://us-central1-tracking-delivery-status-api.cloudfunctions.net/getTrackingJson?delivery_carrier_code=${deliveryCarrierCode}&tracking_number=${trackingNumber}`;
        const rs = await fetch(url);
        const result = rs.text();
        
        return result
    }

    const jsonhandle = () =>{
        getjson().then((r)=>setResultJson(r))
    } 

    const handleSelect = (e)=>{
        const code = e.target.value;
        setDeliveryCarrierCode(code);
    }

    const handleText = (e)=>{
        const number = e.target.value;
        setTrackingNumber(number);
    }

    return (
        <div>
            <select onChange={handleSelect}>
                {deliveryCarrierList.map((value, index) => {
                    return <option value={value} key={index}>{value}</option>
                })}
            </select>
            <input type="text" onChange={handleText} />
            <button onClick={jsonhandle}>送信</button>
            <h1>{deliveryCarrierCode}</h1>
            <h2>{trackingNumber}</h2>
            <h3>{resultJson}</h3>
        </div>
    );

}

export default App;