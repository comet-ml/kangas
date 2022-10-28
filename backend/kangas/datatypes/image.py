# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#    Copyright (c) 2022 Kangas Development Team      #
#    All rights reserved                             #
######################################################

import io
import json
import logging
import math

import numpy as np
import PIL.Image
from matplotlib import cm

from .._typing import IO, Any, Optional, Sequence, Union
from .base import Asset
from .utils import (
    convert_tensor_to_numpy,
    flatten,
    generate_image,
    get_file_extension,
    image_to_fp,
    is_valid_file_path,
    rescale_array,
)

LOGGER = logging.getLogger(__name__)


def _verify_box(box):
    """
    Ensure that a box is [[min_x, min_y], [max_x, max_y]]
    """
    x1, y1 = box[0]
    x2, y2 = box[1]

    return [[min(x1, x2), min(y1, y2)], [max(x1, x2), max(y1, y2)]]


class Image(Asset):
    """
    An Image asset.
    """

    ASSET_TYPE = "Image"

    def __init__(
        self,
        data=None,
        name=None,
        format="png",
        scale=1.0,
        shape=None,
        colormap=None,
        minmax=None,
        channels="last",
        metadata=None,
        source=None,
        unserialize=False,
    ):
        """
        Logs the image.

        Args:
            data: Required if source not given. data is one of the following:
                - a path (string) to an image
                - a file-like object containing an image
                - a numpy matrix
                - a TensorFlow tensor
                - a PyTorch tensor
                - a list or tuple of values
                - a PIL Image
            name: String - Optional. A custom name to be displayed on the dashboard.
                If not provided the filename from the `data` argument will be
                used if it is a path.
            format: Optional. String. Default: 'png'. If the data is
                actually something that can be turned into an image, this is the
                format used. Typical values include 'png' and 'jpg'.
            scale: Optional. Float. Default: 1.0. If the data is actually
                something that can be turned into an image, this will be the new
                scale of the image.
            shape: Optional. Tuple. Default: None. If the data is actually
                something that can be turned into an image, this is the new shape
                of the array. Dimensions are (width, height) or (width, height, colors)
                where `colors` is 3 (RGB) or 1 (grayscale).
            colormap: Optional. String. If the data is actually something
                that can be turned into an image, this is the colormap used to
                colorize the matrix.
            minmax: Optional. (Number, Number). If the data is actually
                something that can be turned into an image, this is the (min, max)
                used to scale the values. Otherwise, the image is autoscaled between
                (array.min, array.max).
            channels: Optional. Default 'last'. If the data is
                actually something that can be turned into an image, this is the
                setting that indicates where the color information is in the format
                of the 2D data. 'last' indicates that the data is in (rows, columns,
                channels) where 'first' indicates (channels, rows, columns).
        """
        super().__init__(source)
        if unserialize:
            return
        if self.source is not None:
            filename = self.source["source"]
            self._log_metadata(
                name=name,
                filename=filename,
                extension=get_file_extension(filename),
            )
            if metadata:
                self._log_metadata(**metadata)

            return

        if data is None:
            raise TypeError("data cannot be None")

        file_like, size = _image_data_to_file_like_object(
            data,
            name,
            format,
            scale,
            shape,
            colormap,
            minmax,
            channels,
            self.metadata,
        )
        self.metadata["image"] = {"width": size[0], "height": size[1]}
        self.asset_data = file_like.read()
        if name:
            self.metadata["filename"] = name
            self.metadata["extension"] = get_file_extension(name)
        if metadata:
            self.metadata.update(metadata)

    def to_pil(self):
        """
        Return the image as a Python Image Library (PIL) image.

        Example:
        ```
        >>> import kangas as kg
        >>> image = kg.Image("filename.jpg").to_pil()
        >>> image.show()
        ```
        """
        return generate_image(self.asset_data)

    def show(self):
        """
        Show the image.
        """
        return self.to_pil().show()

    def convert_to_source(self, filename=None):
        """
        A PNG filename to save the loaded image.

        Under development.
        """
        import PIL

        if self.source is not None:
            print("Skipping %s as it is already a source asset" % self.asset_id)
            return

        filename = filename if filename else "%s.png" % self.asset_id

        fp = io.BytesIO(self.asset_data)
        im = PIL.Image.open(fp)
        im.save(filename)

        sfilename = "file://%s" % filename
        self.source = sfilename
        self.asset_data = json.dumps({"source": sfilename})
        self.metadata["source"] = sfilename
        self.metadata["filename"] = filename
        self.metadata["extension"] = "png"

    def _init_overlays(self, label=None, count=0):
        if "overlays" not in self.metadata:
            self.metadata["overlays"] = []
            self.metadata["labels"] = {}
            self.metadata["count"] = 0

        self.metadata["count"] += count
        if label:
            if label not in self.metadata["labels"]:
                self.metadata["labels"][label] = count
            else:
                self.metadata["labels"][label] += count

    def add_regions(self, label, *regions, score=None):
        """
        Add polygon regions to an image.

        Args:
            label: (str) the label for the regions
            regions: list or tuples of at least 3 points
            score: (optional, number) a score associated
               with the region.

        Example:
        ```
        >>> image = Image()
        >>> image.add_regions("car", [(x1, y1), ...], [(x2, y2), ...])
        ```
        """
        self._init_overlays(label, len(regions))

        self.metadata["overlays"].append(
            {
                "label": label,
                "type": "regions",
                "data": list(regions),
                "score": score,
            }
        )
        return self

    def add_bounding_boxes(self, label, *boxes, score=None):
        """
        Add bounding boxes to an image.

        Args:
            label: (str) the label for the regions
            boxes: list or tuples of exactly 2 points (top-left, bottom-right)
            score: (optional, number) a score associated
               with the region.

        Example:
        ```
        >>> image = Image()
        >>> box1 = [(x1, y1), (x2, y2)]
        >>> box2 = [(x1, y1), (x2, y2)]
        >>> image.add_bounding_boxes("Person", box1, box2, ...)
        ```
        """
        self._init_overlays(label, len(boxes))

        self.metadata["overlays"].append(
            {
                "label": label,
                "type": "boxes",
                "data": [_verify_box(box) for box in boxes],
                "score": score,
            }
        )
        return self

    def add_mask(self, label, image):
        """
        Add a mask to an image.

        Under development.

        Example:
        ```
        >>> image = Image()
        >>> image.add_mask("attention", Image(MASK))
        ```
        """
        if not isinstance(image, Image):
            raise ValueError("Image.add_mask() requires a label and Image")

        self._init_overlays()
        # Image will be serialized when it is saved
        self.metadata["overlays"].append(
            {
                "label": label,
                "type": "mask",
                "data": image,
            }
        )
        return self

    def add_annotations(self, text, anchor, *points, score=None):
        """
        Add an annotation to an image.

        Under development.

        Example:
        ```
        >>> image = Image()
        >>> image.add_annotations("Tumors", (50, 50), (100, 100), (200, 200), ...)
        ```
        """
        self._init_overlays(text, len(points))
        self.metadata["overlays"].append(
            {
                "label": text,
                "type": "annotation",
                "data": [list(anchor), list(points)],
                "score": score,
            }
        )
        return self


def _image_data_to_file_like_object(
    image_data,
    file_name,
    image_format,
    image_scale,
    image_shape,
    image_colormap,
    image_minmax,
    image_channels,
    metadata,
):
    # type: (Union[IO[bytes], Any], Optional[str], str, float, Optional[Sequence[int]], Optional[str], Optional[Sequence[float]], str, Optional[Any]) -> Union[IO[bytes], None, Any]
    """
    Ensure that the given image_data is converted to a file_like_object ready
    to be uploaded
    """
    ## Conversion from standard objects to image
    ## Allow file-like objects, numpy arrays, etc.

    if is_valid_file_path(image_data):
        metadata["extension"] = get_file_extension(image_data)
        metadata["filename"] = image_data
        file_contents = open(image_data, "rb")
        image = PIL.Image.open(image_data)
        return file_contents, image.size
    elif hasattr(image_data, "numpy"):  # pytorch tensor
        array = convert_tensor_to_numpy(image_data)
        results = _array_to_image_fp_size(
            array,
            image_format,
            image_scale,
            image_shape,
            image_colormap,
            image_minmax,
            image_channels,
        )
        return results
    elif hasattr(image_data, "eval"):  # tensorflow tensor
        array = image_data.eval()
        results = _array_to_image_fp_size(
            array,
            image_format,
            image_scale,
            image_shape,
            image_colormap,
            image_minmax,
            image_channels,
        )
        return results
    elif isinstance(image_data, PIL.Image.Image):  # PIL.Image
        # If CMYK, then needs a conversion:
        if image_data.mode == "CMYK":
            image_data = image_data.convert("RGB")
        ## filename tells us what format to use:
        if file_name is not None and "." in file_name:
            _, image_format = file_name.rsplit(".", 1)
        results = image_to_fp(image_data, image_format), image_data.size
        return results
    elif image_data.__class__.__name__ == "ndarray":  # numpy array
        results = _array_to_image_fp_size(
            image_data,
            image_format,
            image_scale,
            image_shape,
            image_colormap,
            image_minmax,
            image_channels,
        )
        return results
    elif hasattr(image_data, "read"):  # file-like object
        return image_data
    elif isinstance(image_data, (tuple, list)):  # list or tuples
        array = np.array(image_data)
        results = _array_to_image_fp_size(
            array,
            image_format,
            image_scale,
            image_shape,
            image_colormap,
            image_minmax,
            image_channels,
        )
        return results
    else:
        LOGGER.error("invalid image file_type: %s", type(image_data))
        return None


def _array_to_image_fp_size(
    array,
    image_format,
    image_scale,
    image_shape,
    image_colormap,
    image_minmax,
    image_channels,
):
    # type: (Any, str, float, Optional[Sequence[int]], Optional[str], Optional[Sequence[float]], str) -> Optional[IO[bytes]]
    """
    Convert a numpy array to an in-memory image
    file pointer.
    """
    image = _array_to_image(
        array, image_scale, image_shape, image_colormap, image_minmax, image_channels
    )
    if not image:
        return None
    return image_to_fp(image, image_format), image.size


def _array_to_image(
    array,
    image_scale=1.0,
    image_shape=None,
    image_colormap=None,
    image_minmax=None,
    image_channels=None,
    mode=None,
):
    # type: (Any, float, Optional[Sequence[int]], Optional[str], Optional[Sequence[float]], Optional[str], Optional[str]) -> Optional[Any]
    """
    Convert a numpy array to an in-memory image.
    """
    array = np.array(array)

    ## Handle image transformations here
    ## End up with a 0-255 PIL Image
    if image_minmax is not None:
        minmax = image_minmax
    else:  # auto minmax
        flatten_array = flatten(array)
        min_array = min(flatten_array)
        max_array = max(flatten_array)
        if min_array == max_array:
            min_array = min_array - 0.5
            max_array = max_array + 0.5
        min_array = math.floor(min_array)
        max_array = math.ceil(max_array)
        minmax = [min_array, max_array]

    ## if a shape is given, try to reshape it:
    if image_shape is not None:
        try:
            ## array shape is opposite of image size(width, height)
            if len(image_shape) == 2:
                array = array.reshape(image_shape[1], image_shape[0])
            elif len(image_shape) == 3:
                array = array.reshape(image_shape[1], image_shape[0], image_shape[2])
            else:
                raise Exception(
                    "invalid image_shape: %s; should be 2D or 3D" % image_shape
                )
        except Exception:
            LOGGER.info("WARNING: invalid image_shape; ignored", exc_info=True)

    if image_channels == "first" and len(array.shape) == 3:
        array = np.moveaxis(array, 0, -1)
    ## If 3D, but last array is flat, make it 2D:
    if len(array.shape) == 3:
        if array.shape[-1] == 1:
            array = array.reshape((array.shape[0], array.shape[1]))
        elif array.shape[0] == 1:
            array = array.reshape((array.shape[1], array.shape[2]))
    elif len(array.shape) == 1:
        ## if 1D, make it 2D:
        array = np.array([array])

    ### Ok, now let's colorize and scale
    if image_colormap is not None:
        ## Need to be in range (0,1) for colormapping:
        array = rescale_array(array, minmax, (0, 1), "float")
        try:
            cm_hot = cm.get_cmap(image_colormap)
            array = cm_hot(array)
        except Exception:
            LOGGER.info("WARNING: invalid image_colormap; ignored", exc_info=True)
        ## rescale again:
        array = rescale_array(array, (0, 1), (0, 255), "uint8")
        ## Convert to RGBA:
        image = PIL.Image.fromarray(array, "RGBA")
    else:
        ## Rescale (0, 255)
        array = rescale_array(array, minmax, (0, 255), "uint8")
        image = PIL.Image.fromarray(array)

    if image_scale != 1.0:
        image = image.resize(
            (int(image.size[0] * image_scale), int(image.size[1] * image_scale))
        )

    ## Put in a standard mode:
    if mode:
        image = image.convert(mode)
    elif image.mode not in ["RGB", "RGBA"]:
        image = image.convert("RGB")
    return image
