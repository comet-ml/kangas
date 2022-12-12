import fetchAsset from '../../../lib/fetchAsset';


const ImageCell = async ({ value, query, expanded }) => {
    const { type, assetType, assetId } = value;
    const { dgid } = query;
    const image = await fetchAsset({ query: { assetId, dgid }, returnUrl: true, thumbnail: !expanded });

    return (
            <div className="cell-content">
                <img
                    src={`data:application/octet-stream;base64,${image}`}
                    alt="DataGrid Image"
                />
            </div>
    );
};

export default ImageCell;
