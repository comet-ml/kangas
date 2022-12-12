import fetchAsset from '../../../lib/fetchAsset';


const GroupedImageCell = async ({ value, query, columnName, expanded }) => {
    // TODO Un-hardcode these properties
    const image = await fetchAsset({ 
        query: {
            gallerySize: [3, 2],
            backgroundColor: [255, 255, 255],
            imageSize: [100, 55],
            borderWidth: 2,
            ...value
        }, 
        returnUrl: true, 
        thumbnail: true 
    });

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
