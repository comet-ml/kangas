import fetchAsset from '../../../lib/fetchAsset';


const ImageCell = async ({ value, dgid }) => {
    const { type, assetType, assetId } = value;

    const image = await fetchAsset({ assetId, dgid, returnUrl: true });

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
