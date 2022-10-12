import { Suspense } from 'react';

// Config

// Utils
import { useData } from '../../../lib/useData';
import fetchAsset from '../../../lib/fetchAsset';
import Image from 'next/image';

const ImageCell = ({ value, dgid }) => {
    const { assetId } = value;
    // Fetch this here, so it is available in the expanded view:
    /* eslint-disable no-unused-vars */
    const image = useData(`${assetId}`, () =>
        fetchAsset({ assetId, dgid, returnUrl: true })
    );
    /* eslint-enable no-unused-vars */
    const thumbnail = useData(`${assetId}-thumbnail`, () =>
        fetchAsset({ assetId, dgid, returnUrl: true, thumbnail: true })
    );

    return (
        <div className="cell-content image">
            <Suspense fallback={<span>fallback</span>}>
                <Image
                    src={`data:application/octet-stream;base64,${thumbnail.data}`}
                    layout="fill"
                    objectFit="contain"
                    alt="DataGrid Image Thumbnail"
                />
            </Suspense>
        </div>
    );
};

export default ImageCell;
