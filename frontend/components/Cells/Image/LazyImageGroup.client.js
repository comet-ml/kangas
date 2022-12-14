/* eslint-disable react/jsx-key */

import { useCallback, useEffect, useRef, useState, useContext } from 'react';
import Image from 'next/image';
import { ConfigContext } from '../ClientContext.client';
import ImageCanvas from './ImageCanvas.client';
import DialogueModalContainer from '../../Modals/DialogueModalContainer.client';

const LazyImageGroup = ({ images, dgid, children }) => {
    const { apiUrl } = useContext(ConfigContext);
    const [visible, setVisible] = useState(20);
    const lazyRoot = useRef(null);
    const scrollBoundary = useRef();
    const root = useRef();

    const loadDeferred = useCallback(
        (entries) => {
            if (entries[0].isIntersecting) {
                setVisible(visible + 100);
            }
        },
        [visible, setVisible]
    );

    /* FIXME: The ref value 'scrollBoundary.current' will likely have changed
       by the time this effect cleanup function runs. If this ref points to a
       node rendered by React, copy 'scrollBoundary.current' to a variable
       inside the effect, and use that variable in the cleanup function. */

    useEffect(() => {
        if (!scrollBoundary?.current) return;
        const observer = new IntersectionObserver(loadDeferred);
        observer.observe(scrollBoundary.current);
        return () => {
            if (scrollBoundary?.current) {
                observer.unobserve(scrollBoundary.current);
            }
        };
    }, [loadDeferred]);

    return (
        <div className="asset-grid" ref={root}>
            {children}
            {visible &&
                images.values.slice(0, visible + 1).map((id) => (
                    <DialogueModalContainer
                        toggleElement={
                            <div
                                className="image"
                                style={{
                                    width: '110px',
                                    height: '55px',
                                    position: 'relative',
                                }}
                            >
                                <Image
                                    src={`/api/image?url=${encodeURIComponent(
                                        `${apiUrl}download?assetId=${id}&dgid=${dgid}`
                                    )}`}
                                    lazyRoot={lazyRoot}
                                    layout={'fill'}
                                    objectFit={'contain'}
                                    alt="DataGrid Image"
                                />
                            </div>
                        }
                    >
                        <ImageCanvas
                            url={`${apiUrl}download?assetId=${id}&dgid=${dgid}`}
                            dgid={dgid}
                            assetId={id}
                        />
                    </DialogueModalContainer>
                ))}
            <div style={{ width: '100%' }} ref={scrollBoundary}></div>
        </div>
    );
};

export default LazyImageGroup;
