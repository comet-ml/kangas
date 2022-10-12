import { Suspense } from 'react';

// Server Components

// Client Components

// Config
import config from '../../../config';

// Util
import { useData } from '../../../lib/useData';
import fetchAssetGroup from '../../../lib/fetchAssetGroup';
import fetchAssetGroupMetadata from '../../../lib/fetchAssetGroupMetadata';
import hashQuery from '../../../lib/hashQuery';
import ImageCanvas from './ImageCanvas.client';

const ExpandedGroupImageCell = ({ value, dgid }) => {
    const metadataQuery = { ...value, metadataPath: 'labels' };
    const images = useData(`${hashQuery(value)}`, () =>
        fetchAssetGroup({ query: value, thumbnail: true })
    ).data;
    const labels = useData(`${hashQuery(metadataQuery)}`, () =>
        fetchAssetGroupMetadata({ query: metadataQuery })
    ).data;
    const metadata = JSON.stringify({ labels });
    const urls = images.values.map(
        (id) => `${config.apiUrl}download?assetId=${id}&dgid=${dgid}`
    );

    return (
        <Suspense fallback={<div>loading</div>}>
            <ImageCanvas urls={urls} metadata={metadata} dgid={dgid} />
        </Suspense>
    );
};

export default ExpandedGroupImageCell;
