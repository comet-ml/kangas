import { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { ConfigContext } from '../components/Cells/ClientContext.client';


// Returns a URL that can be used as the src for assets like images.
const useAsset = (url) => {
    const { isIframe, apiUrl } = useContext(ConfigContext);
    const [asset, setAsset] = useState();
    const listenerAttached = useRef(false);
    const { dgid, assetId } = useMemo(() => {
        const params = new URL(url).searchParams;
        return { 
            dgid: params.get('dgid'), 
            assetId: params.get('assetId')
        }
    }, [url]);

    useEffect(() => {
        // Handle Iframes (Jupyter notebooks/Colab etc.)

        // Attach asset listener
        if (isIframe && !listenerAttached.current) {
            window.addEventListener("message", e => {
                const { messageType, ...data } = e.data;
                if (messageType === 'asset') {
                    setAsset(`data:image/png;base64,${data.src}`);
                }
            }, false);
            listenerAttached.current = true;
        }

        if (isIframe) {
            // Fire postMessage request for asset
            if (assetId && dgid) {
                window.parent.postMessage({dgid, assetId, type: 'asset'}, "*");
            }
        }

        // Simply use the given URL if we are fetching traditionally
        else {
            setAsset(url);
        }
    }, [url, assetId, dgid, isIframe]);

    return asset;
}

export default useAsset;