const isTagHidden = function(hiddenLabels, tag) {
    return (tag && hiddenLabels?.[tag]);
};

const makeTag = function(layerName, label) {
    return `${layerName}: ${label}`;
};

export {
    isTagHidden,
    makeTag
};
