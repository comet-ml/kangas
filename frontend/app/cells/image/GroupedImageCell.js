import fetchAsset from '../../../lib/fetchAsset';
import ImageCanvasCell from './ImageCanvas/ImageCanvasCell';

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
const cx = classNames.bind(styles);

const ThumbnailGroupCell = async ({ value, query, columnName, expanded }) => {
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
            <div className={cx(["cell", "group"])}>
                <img
                    src={`data:application/octet-stream;base64,${image}`}
                    alt="DataGrid Image"
                />
            </div>
    );
};

const GroupedImageCell = ({ value, query, columnName, expanded }) => {
    if (!expanded) return <ThumbnailGroupCell value={value} query={query} columnName={columnName} expanded={expanded} />
    else return <ImageCanvasCell value={value} query={query} columnName={columnName} expanded={expanded} />
}

export default GroupedImageCell;
