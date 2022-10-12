import { Suspense } from 'react';

// Server Components
import Image from 'next/image';

// Utils
import { useData } from '../../../lib/useData';
import fetchAssetGroupThumbnail from '../../../lib/fetchAssetGroupThumbnail';
import fetchAssetGroup from '../../../lib/fetchAssetGroup';
import hashQuery from '../../../lib/hashQuery';

const ImageGroupCell = ({ value }) => {
    const query = {
        ...value,
        gallerySize: [3, 2],
        backgroundColor: [255, 255, 255],
        imageSize: [100, 55],
        borderWidth: 2,
    };
    // gallerySize is the number of columns, rows of the gallery image
    // imageSize is the max-width, max-height in pixels of each thumbnail image
    // in the gallery
    const countQuery = {
        ...value,
        columnLimit: 0,
    };
    const groupThumbnail = useData(`${hashQuery(query)}`, () =>
        fetchAssetGroupThumbnail({ query })
    );
    const groupDetails = useData(`${hashQuery(countQuery)}`, () =>
        fetchAssetGroup({ query: countQuery })
    );

    return (
        <div className="cell-content image-group">
            <Suspense fallback={<span>fallback</span>}>
                <span>{`${groupDetails.data.total} Images`}</span>
                <Image
                    src={`data:application/octet-stream;base64,${groupThumbnail.data}`}
                    layout="fill"
                    objectFit="contain"
                    alt="Image Group Thumbnail"
                />
            </Suspense>
        </div>
    );
};

export default ImageGroupCell;
