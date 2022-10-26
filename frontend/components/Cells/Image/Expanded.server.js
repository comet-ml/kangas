import { Suspense } from 'react';

import { useData } from '../../../lib/useData';
import hashQuery from '../../../lib/hashQuery';
import fetchAsset from '../../../lib/fetchAssetMetadata';
// Config
import config from '../../../config';

// Client
import ImageCanvas from './ImageCanvas.client';

const ExpandedImageCell = ({ value, dgid }) => {
    const { assetId } = value;
    const url = `${config.apiUrl}download?assetId=${assetId}&dgid=${dgid}`;
    const metadata = useData(`${hashQuery({ assetId, dgid })}`, () =>
        fetchAsset({ assetId, dgid })
    ).data;

    return (
        <Suspense fallback={<>Loading</>}>
            <ImageCanvas
                url={url}
                dgid={dgid}
                assetId={assetId}
                inheritedMetadata={metadata}
            />
        </Suspense>
    );
};

export default ExpandedImageCell;
