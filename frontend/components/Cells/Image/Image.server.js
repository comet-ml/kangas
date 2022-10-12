/* eslint-disable @next/next/no-img-element */

import { Suspense } from 'react';

// Utils
import { useData } from '../../../lib/useData';
import fetchAsset from '../../../lib/fetchAsset';

const Image = ({ assetId, dgid }) => {
    const image = useData(`${assetId}`, () =>
        fetchAsset({ assetId, dgid, returnUrl: true })
    );

    return (
        <Suspense fallback={<span>fallback</span>}>
            <img
                src={`data:application/octet-stream;base64,${image.data}`}
                alt="DataGrid Image"
            />
        </Suspense>
    );
};

export default Image;
