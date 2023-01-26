'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const Test = ({ test }) => {
    const [visible, setVisible] = useState();
    const [init, setInit] = useState(test);

    const query = useMemo(() => {
        const q = JSON.parse(test);
        const queryString = new URLSearchParams({ 
            assetId: q?.assetId, 
            dgid: query?.dgid, 
            timestamp: query?.timestamp, 
            thumbnail: true,
            endpoint 
        }).toString();
    
    },[test]);

    const toggle = useCallback(() => {
        const timeout = setTimeout(() => setVisible(true), Math.random() * 5000)
    }, []);

    useEffect(() => {
        if (!visible) toggle();
    }, [toggle, visible]);

    useEffect(() => {
        if (init != test) {
            setVisible(false);
            setInit(test);
        }
    }, [init, test]);

    return (
        <>
            <img src='/api/charts?' loading="lazy" />
        </>
    )
}

export default Test;