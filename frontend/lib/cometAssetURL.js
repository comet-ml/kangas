import config from '../config';

const cometAssetURL = ({ assetId, assetType, type, experimentKey }) => {
    const url = new URL(
        `${config.assetUrl}download?experimentKey=${experimentKey}&assetId=${assetId}`
    );
    return {
        src: url.href,
    };
};

export default cometAssetURL;
