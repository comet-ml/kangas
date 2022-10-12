// Config
import config from '../../config';

// Util
import { useData } from '../../lib/useData';
import fetchAsset from '../../lib/fetchAsset';
import fetchData from '../../lib/fetchData';
// import hljs from 'highlight.js';

// In comet-react, we use highlight.js to render text. This is not a problem for RSC—highlight.js works on the server—but it's
// not clear why we actually use highlight in comet-react. The point of highlight is that it can provide formatting for a variety
// of text formats (different programming languages, in particular), but we have hardcoded the language to "plaintext" in comet-react
const TextAssetCell = ({ value, dgid }) => {
    const { type, assetId, assetType } = value;
    const image = useData(`${assetId}`, () => fetchAsset({ assetId, dgid }));
    // const asset = useData(`${cell.src}`, () => fetchData({url: cell.src, method: 'GET', returnType: 'blob'}).then(blob => blob.text()));
    // const { data: text, error } = asset;
    // const parsed = hljs.highlightAuto(text);
    return (
        <div className="cell-content text-asset">
            <pre>
                <code>{'text'}</code>
            </pre>
        </div>
    );
};

export default TextAssetCell;
