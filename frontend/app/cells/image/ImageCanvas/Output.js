import ImageCanvasOutputClient from "./OutputClient"
import fetchAsset from "@kangas/lib/fetchAsset"
import fetchAssetMetadata from "@kangas/lib/fetchAssetMetadata";
import styles from './ImageCanvas.module.scss';
import classNames from 'classnames/bind';
import Deferred from "@kangas/app/DeferredComponent";

import config from "@kangas/config";

const cx = classNames.bind(styles);


const ImageCanvasOutput = async ({ assetId, dgid, timestamp }) => {
    const querystring = new URLSearchParams({
        assetId,
        dgid,
        timestamp,
        endpoint: 'download'
    }).toString();

    // TODO Fetch metadata here when we fix fetch retries/the open file limit on the server
    //const metadata = await fetchAssetMetadata({ assetId, dgid, timestamp });

    return (
        <div className={cx('output-container')}>
            <Deferred>
                <ImageCanvasOutputClient
                    assetId={assetId}
                    timestamp={timestamp}
                    dgid={dgid}
                    imageSrc={`${config.rootPath}api/image?${querystring}`}
                />
            </Deferred>
        </div>
    )

}

export default ImageCanvasOutput;
