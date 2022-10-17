import { useData } from '../../lib/useData';
import fetchAsset from '../../lib/fetchAsset';

const TextAssetCell = ({ value, dgid }) => {
    const { type, assetId, assetType } = value;
    const image = useData(`${assetId}`, () => fetchAsset({ assetId, dgid }));
    return (
        <div className="cell-content text-asset">
            <pre>
                <code>{'text'}</code>
            </pre>
        </div>
    );
};

export default TextAssetCell;
