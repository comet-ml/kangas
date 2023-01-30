
const computeScale = (canvasWidth, canvasHeight, width, height) => {
    if (width > height) {
        if (width < canvasWidth) {
            return Math.max(width / canvasWidth, canvasWidth / width);
        } else {
            return Math.min(width / canvasWidth, canvasWidth / width);
        }
    } else {
        if (height < canvasHeight) {
            return Math.max(height / canvasHeight, canvasHeight / height);
        } else {
            return Math.min(height / canvasHeight, canvasHeight / height);
        }
    }
}

export default computeScale;