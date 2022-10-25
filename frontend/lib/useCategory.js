import { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { ConfigContext } from '../components/Cells/ClientContext.client';
import { v4 as uuid } from 'uuid';

const useCategory = (query) => {
    const { isIframe, apiUrl } = useContext(ConfigContext);
    const [categoryData, setData] = useState();
    const listenerAttached = useRef(false);
    const listenerId = useMemo(() => uuid(), []);

    useEffect(() => {
        // Handle Iframes (Jupyter notebooks/Colab etc.)

        // Attach category listener
        if (isIframe && !listenerAttached.current && listenerId) {
            window.addEventListener("message", e => {
                const { messageType, targetId, raw } = e.data;
                if (messageType === 'category' && targetId === listenerId) {
                    const parsed = JSON.parse(raw.replace(/\n/g, '').replace(/\'/g, `"`).replace(`: None`, `: null`));
                    setData(parsed);
                }
            }, false);
            listenerAttached.current = true;
        }

        if (isIframe) {
            // Fire postMessage request for category
            if (query && listenerId) {
                window.parent.postMessage({...query, targetId: listenerId, type: 'category'}, "*");
            }
        }

        // non-iframe fetching
        else {
            fetch(`${apiUrl}category`, {
                body: JSON.stringify(query),
                method: 'post',
            })
            .then(res => res.json())
            .then(d => setData(d))
        }
    }, [query, isIframe, listenerId]);

    return categoryData;
}

export default useCategory;