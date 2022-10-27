import { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { ConfigContext } from '../components/Cells/ClientContext.client';
import { v4 as uuid } from 'uuid';
/* 
Kangas fetches assets and metadata in different ways depending on the circumstance. Wherever possible,
Kangas fetches on the server-side, making use of React Server Components. However, in situations where
client-side fetching is necessary—like in the <Canvas /> component, Kangas has two different modes of 
client-side fetching, depending on environment. When running inside an iframe, like in a Colab/Jupyter environment,
Kangas performs fetches by posting a message to the parent frame, which handles data fetching and responds.
Outside of an iframe, Kangas will fetch against the relevant endpoint directly, in some situations making use
of Next.js api routes
*/

const useMetadata = (dgid, assetId, inheritedMetadata) => {
    const { isColab, apiUrl } = useContext(ConfigContext);
    const [metadata, setMetadata] = useState();
    const listenerAttached = useRef(false);
    const listenerId = useMemo(() => uuid(), []);

    useEffect(() => {
        // Handle Colab

        // Attach metadata listener
        if (isColab && !listenerAttached.current && listenerId) {
            window.addEventListener("message", e => {
                const { messageType, targetId, ...data } = e.data;
                if (messageType === 'metadata' && targetId === listenerId) {
                    setMetadata(data);
                }
            }, false);
            listenerAttached.current = true;
        }

        if (isColab && listenerId) {
            // Fire postMessage request for metadata
            if (assetId && dgid) {
                window.parent.postMessage({dgid, assetId, targetId: listenerId, type: 'metadata'}, "*");
            }
        }

        // Non-iframe fetching
        else if (!isColab) {
            fetch(`/api/metadata?${new URLSearchParams({
                assetId,
                dgid,
                url: `${apiUrl}asset-metadata`,
            })}`)
            .then((res) => res.json())
            .then((data) => setMetadata(JSON.parse(data)));

        }
    }, [dgid, assetId, listenerId, isColab]);

    if (inheritedMetadata) return JSON.parse(inheritedMetadata); // TODO: Remove this escape hatch when we fix the clientFetchMeta mess in ImageCanvas 
    return metadata;
}

export default useMetadata;