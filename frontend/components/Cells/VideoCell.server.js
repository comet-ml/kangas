// Config
import config from '../../config';

// Util
import { useData } from '../../lib/useData';
import fetchAsset from '../../lib/fetchAsset';

/* In comet-react, we use react-player, which gives us out of the box support for YouTube/Vimeo/Wistia links etc.
However, it is also heavy and completely client side. The question is: How big is that use case? How often are users
logging links to 3rd party video platforms as part of their data vs. logging actual video files? */
const VideoCell = ({ value, dgid }) => {
    const { type, assetId, assetType } = value;
    //const video = useData(`${assetId}`, () => fetchAsset({ assetId, dgid, returnUrl: true}));
    const video_url = `${config.apiUrl}download?assetId=${assetId}&dgid=${dgid}`;
    return (
        <div className="cell-content video">
            <video src={video_url} controls />
        </div>
    );
};

export default VideoCell;
