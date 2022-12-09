import fetchAsset from '../../../lib/fetchAsset';


const GroupedImageCell = async ({ value, dgid, expanded }) => {
    const { type, assetType, assetId } = value;

    const image = await fetchAsset({ assetId, dgid, returnUrl: true, thumbnail: true, group: true });

    return (
            <div className="cell-content">
                <img
                    src={`data:application/octet-stream;base64,${image}`}
                    alt="DataGrid Image"
                />
            </div>
    );
};

export default GroupedImageCell;
