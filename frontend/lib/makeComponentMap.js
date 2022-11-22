import ImageCell from '../components/Cells/Image/ImageCell.server';
import ImageGroupCell from '../components/Cells/Image/Group.server';
import ExpandedImageCell from '../components/Cells/Image/Expanded.server';
import ExpandedGroupImageCell from '../components/Cells/Image/ExpandedGroup.server';
import DateCell from '../components/Cells/DateCell.server';
import TextCell from '../components/Cells/TextCell.server';
import FloatCell from '../components/Cells/FloatCell.server';
import FloatExpanded from '../components/Cells/FloatExpanded.server';
import AudioCell from '../components/Cells/AudioCell.server';
import VideoCell from '../components/Cells/VideoCell.server';
import TextAssetCell from '../components/Cells/TextAssetCell.server';
import CurveAssetCell from '../components/Cells/CurveAssetCell.server';
import BooleanCell from '../components/Cells/BooleanCell.server';
import JSONCell from '../components/Cells/JSONCell.server';
import VectorCell from '../components/Cells/VectorCell.server';
import PlaceholderCell from '../components/Cells/PlaceholderCell.server';
import HistogramGroupCell from '../components/Cells/Histogram/HistogramGroupCell.server';
import HistogramGroupExpanded from '../components/Cells/Histogram/HistogramGroupExpanded.server';
import CategoryGroupCell from '../components/Cells/Category/CategoryGroupCell.server';
import CategoryGroupExpanded from '../components/Cells/Category/CategoryGroupExpanded.server';
const SINGLE_VALUE_WIDTH = 75;
const GROUPED_ASSET_WIDTH = 150;

export const columnTypeMap = {
    BOOLEAN: {
        component: BooleanCell,
        expandedComponent: BooleanCell,
        groupComponent: CategoryGroupCell,
        expandedGroupComponent: CategoryGroupExpanded,
        singleWidth: SINGLE_VALUE_WIDTH,
        groupedWidth: GROUPED_ASSET_WIDTH,
    },
    TEXT: {
        component: TextCell,
        expandedComponent: TextCell,
        groupComponent: CategoryGroupCell,
        expandedGroupComponent: CategoryGroupExpanded,
        singleWidth: SINGLE_VALUE_WIDTH,
        groupedWidth: GROUPED_ASSET_WIDTH,
    },
    INTEGER: {
        component: TextCell,
        expandedComponent: TextCell,
        groupComponent: CategoryGroupCell,
        expandedGroupComponent: CategoryGroupExpanded,
        singleWidth: SINGLE_VALUE_WIDTH,
        groupedWidth: GROUPED_ASSET_WIDTH,
    },
    FLOAT: {
        component: FloatCell,
        expandedComponent: FloatExpanded,
        groupComponent: HistogramGroupCell,
        expandedGroupComponent: HistogramGroupExpanded,
        singleWidth: SINGLE_VALUE_WIDTH,
        groupedWidth: GROUPED_ASSET_WIDTH,
    },
    DATETIME: {
        component: DateCell,
        expandedComponent: DateCell,
        groupComponent: HistogramGroupCell,
        expandedGroupComponent: HistogramGroupExpanded,
        singleWidth: SINGLE_VALUE_WIDTH,
        groupedWidth: GROUPED_ASSET_WIDTH,
    },
    JSON: {
        component: JSONCell,
        expandedComponent: JSONCell,
        groupComponent: PlaceholderCell,
        expandedGroupComponent: PlaceholderCell,
        singleWidth: 300,
        groupedWidth: 300,
    },
    ROW_ID: {
        component: TextCell,
        expandedComponent: TextCell,
        groupComponent: PlaceholderCell,
        expandedGroupComponent: PlaceholderCell,
        singleWidth: SINGLE_VALUE_WIDTH,
        groupedWidth: SINGLE_VALUE_WIDTH,
    },
    'IMAGE-ASSET': {
        component: ImageCell,
        expandedComponent: ExpandedImageCell,
        groupComponent: ImageGroupCell,
        expandedGroupComponent: ExpandedGroupImageCell,
        singleWidth: SINGLE_VALUE_WIDTH * 2,
        groupedWidth: GROUPED_ASSET_WIDTH,
        isAsset: true,
    },
    'AUDIO-ASSET': {
        component: AudioCell,
        expandedComponent: AudioCell,
        groupComponent: AudioCell,
        expandedGroupComponent: AudioCell,
        singleWidth: SINGLE_VALUE_WIDTH,
        groupedWidth: GROUPED_ASSET_WIDTH,
        isAsset: true,
    },
    'CURVE-ASSET': {
        component: CurveAssetCell,
        expandedComponent: CurveAssetCell,
        groupComponent: CurveAssetCell,
        expandedGroupComponent: CurveAssetCell,
        singleWidth: SINGLE_VALUE_WIDTH,
        groupedWidth: GROUPED_ASSET_WIDTH,
        isAsset: true,
    },
    'TEXT-ASSET': {
        component: TextAssetCell,
        expandedComponent: TextAssetCell,
        groupComponent: TextAssetCell,
        expandedGroupComponent: TextAssetCell,
        singleWidth: SINGLE_VALUE_WIDTH,
        groupedWidth: GROUPED_ASSET_WIDTH,
        isAsset: true,
    },
    'VIDEO-ASSET': {
        component: VideoCell,
        expandedComponent: VideoCell,
        groupComponent: VideoCell,
        expandedGroupComponent: VideoCell,
        singleWidth: SINGLE_VALUE_WIDTH,
        groupedWidth: GROUPED_ASSET_WIDTH,
        isAsset: true,
    },
    PLACEHOLDER: {
        component: PlaceholderCell,
        expandedComponent: PlaceholderCell,
        groupComponent: PlaceholderCell,
        expandedGroupComponent: PlaceholderCell,
        singleWidth: SINGLE_VALUE_WIDTH * 2,
        groupedWidth: GROUPED_ASSET_WIDTH,
        isAsset: false,
    },
    VECTOR: {
        component: VectorCell,
        expandedComponent: VectorCell,
        groupComponent: PlaceholderCell,
        expandedGroupComponent: PlaceholderCell,
        singleWidth: 300,
        groupedWidth: 300,
    }
};

const makeComponentMap = (table) => {
    const { columnTypes, columns, ncols } = table;

    // Make sure our columns aren't foo-bar'd
    if (!columns || columns.length !== ncols) return null;
    const nameToComponent = {};

    columns.forEach((name, idx) => {
        const type = columnTypes[idx];
        nameToComponent[name] = {
            component: columnTypeMap[type].component,
            type,
            accessor: name,
            idx,
            singleWidth: columnTypeMap[type].singleWidth,
            groupedWidth: columnTypeMap[type].groupedWidth,
            isAsset: columnTypeMap[type].isAsset,
        };
    });

    return nameToComponent;
};

export default makeComponentMap;
