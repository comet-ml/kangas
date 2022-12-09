import fetchAsset from '../../../lib/fetchAsset';


const ImageCell = async ({ value, dgid, expanded }) => {
    const { type, assetType, assetId } = value;

    const image = await fetchAsset({ assetId, dgid, returnUrl: true, thumbnail: !expanded });
    console.log(image)

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
