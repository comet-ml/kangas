'use client';

import CachedIcon from '@mui/icons-material/Cached';
// FIXME:
//import { useRefreshRoot } from 'next/dist/client/streaming/refresh';
import { useCallback } from 'react';

const RefreshButton = ({ query }) => {
    // FIXME:
    //const refresh = useRefreshRoot();
    const refresh = (query) => {};

    // This is not memoized because we need Date.now() to be current when fired
    const clearCache = () => {
        refresh({
            query,
            expiration: Date.now()
        });
    };

    return (
        <CachedIcon className="cached-icon" onClick={clearCache} />
    );

};

export default RefreshButton;
