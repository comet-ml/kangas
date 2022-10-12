// Config
import config from '../../config';

// Client components
//import Player from '../Player/Player.client';

// Util
import { useData } from '../../lib/useData';
import fetchAsset from '../../lib/fetchAsset';

// To get our fun waveform effect, we need to implement something better than wavesurfer.js. For now, the native
// audio element works fantastic. Users can control playback, skip around, etc.
const AudioCell = ({ value, dgid }) => {
    const { type, assetId, assetType } = value;
    const image = useData(`${assetId}`, () => fetchAsset({ assetId, dgid }));

    // Wavesurfer is going to be difficult with SSR. Need to reconfigure.
    return (
        <div className="cell-content audio">
            <audio src="" controls />
        </div>
    );
    /*
    return (
        <Player
        src={`${cell.src}`}
        style={{ width: '100%' }}
        height={90}
        />
    )*/
};

export default AudioCell;
