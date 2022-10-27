import { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { ConfigContext } from '../components/Cells/ClientContext.client';
import { v4 as uuid } from 'uuid';

// Returns a URL that can be used as the src for assets like images.
const useAsset = (url) => {
    const { isColab, apiUrl } = useContext(ConfigContext);
    const [asset, setAsset] = useState();
    const listenerAttached = useRef(false);
    const listenerId = useMemo(() => uuid(), []);
    const { dgid, assetId } = useMemo(() => {
        const params = new URL(url).searchParams;
        return { 
            dgid: params.get('dgid'), 
            assetId: params.get('assetId')
        }
    }, [url]);

    useEffect(() => {
        // Handle Colab

        // Attach asset listener
        if (isColab && !listenerAttached.current && listenerId) {
            window.addEventListener("message", e => {
                const { messageType, targetId, ...data } = e.data;
                if (messageType === 'asset' && targetId === listenerId) {
                    setAsset(`data:image/png;base64,${data.src}`);
                }
            }, false);
            listenerAttached.current = true;
        }

        if (isColab) {
            // Fire postMessage request for asset
            if (assetId && dgid && listenerId) {
                window.parent.postMessage({dgid, assetId, targetId: listenerId, type: 'asset'}, "*");
            }
        }

        // Simply use the given URL if we are fetching traditionally
        else {
            setAsset(url);
        }
    }, [url, assetId, dgid, isColab, listenerId]);

    return asset;
}

export default useAsset;