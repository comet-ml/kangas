# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#    Copyright (c) 2023 Kangas Development Team      #
#    All rights reserved                             #
######################################################

import io
import json
import logging
import math
import urllib

import numpy as np
import PIL.Image

from .._typing import IO, Any, Optional, Sequence, Union
from .base import Asset
from .utils import (
    _verify_box,
    _verify_line,
    _verify_marker,
    convert_tensor_to_numpy,
    download_filename,
    fast_flatten,
    flatten,
    generate_image,
    get_file_extension,
    image_to_fp,
    is_valid_file_path,
    rescale_array,
    rle_encode,
)

LOGGER = logging.getLogger(__name__)


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
        color_order="rgb",
    ):
        """
        Create an Image asset, ready to be added to a DataGrid.

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
            color_order: Optional. Default 'rgb'. The color order of the incoming
                image data. Only applied when data is an array and color_order is
                "bgr".
        """
        super().__init__(source)
        if unserialize:
            # A function that takes the object to lookup
            self._unserialize = unserialize
            return
        if self.source is not None:
            # FIXME: this is for images, not others?
            filename = self.source
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
            color_order,
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
        ```python
        >>> import kangas as kg
        >>> image = kg.Image("filename.jpg").to_pil()
        >>> image.show()
        ```
        """
        if self.source is not None:
            asset_data = self._get_asset_data_from_source(self.source)
        else:
            asset_data = self.asset_data
        return generate_image(asset_data)

    def _get_asset_data_from_source(self, asset_source):
        # Get the asset_data for an image source
        url_data = urllib.request.urlopen(asset_source)
        with io.BytesIO() as fp:
            fp.write(url_data.read())
            image = PIL.Image.open(fp)
            if image.mode == "CMYK":
                image = image.convert("RGB")
            asset_data = image_to_fp(image, "png").read()
        return asset_data

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

    def _init_annotations(self, layer_name):
        if not isinstance(layer_name, str):
            raise Exception("layer_name must be a string")

        if "annotations" not in self.metadata:
            # Structure:
            # {"annotations": [
            #    {"name": "LAYER-NAME",
            #     "data":
            #       {
            #         "label": [],
            #         "boxes": [] | "points": [] | "mask": mask | "markers": [] | "lines": []
            #         "score": score,
            #         "id": "some-id",
            #         "metadata": {},
            #       }
            # }
            self.metadata["annotations"] = []
        if "labels" not in self.metadata:
            self.metadata["labels"] = {}

        layer = self._get_layer(self.metadata["annotations"], layer_name)
        if layer is None:
            self.metadata["annotations"].append({"name": layer_name, "data": []})

    def _get_layer(self, annotations, layer_name):
        for layer in annotations:
            if layer["name"] == layer_name:
                return layer
        return None

    def _update_annotations(self, layer_name, data):
        layer = self._get_layer(self.metadata["annotations"], layer_name)
        layer["data"].append(data)

        if "label" in data:
            label = data["label"]
            if label not in self.metadata["labels"]:
                self.metadata["labels"][label] = 1
            else:
                self.metadata["labels"][label] += 1
        if "labels" in data:
            for label in data["labels"]:
                if label not in self.metadata["labels"]:
                    self.metadata["labels"][label] = 1
                else:
                    self.metadata["labels"][label] += 1

    def add_regions(
        self,
        label,
        *regions,
        score=None,
        layer_name="(uncategorized)",
        id=None,
        **metadata
    ):
        """
        Add polygon regions to an image.

        Args:
            layer_name: (str) the layer for the label and regions
            label: (str) the label for the regions
            regions: list or tuples of at least 3 points
            score: (optional, number) a score associated
               with the regions
            id: (optional, str) an id associated with the regions

        Example:
        ```python
        >>> image = Image()
        >>> image.add_regions("car", [(x1, y1), ...], [(x2, y2), ...], layer_name="Predictions")
        ```
        """
        if not isinstance(layer_name, str):
            raise Exception("layer_name must be a string")

        if not isinstance(label, str):
            raise Exception("label must be a string")

        self._init_annotations(layer_name)
        self._update_annotations(
            layer_name,
            {
                "label": label,
                "points": [np.array(region).flatten().tolist() for region in regions],
                "score": score,
                "id": id,
                "metadata": metadata,
            },
        )
        return self

    def add_region(
        self,
        label,
        region,
        score=None,
        layer_name="(uncategorized)",
        id=None,
        **metadata
    ):
        """
        Add a polygon region to an image.

        Args:
            layer_name: (str) the layer for the label and region
            label: (str) the label for the region
            region: list or tuple of at least 3 points
            score: (optional, number) a score associated
               with the region
            id: (optional, str) an id associated with the region

        Example:
        ```python
        >>> image = Image()
        >>> image.add_region("car", [(x1, y1), ...], layer_name="Predictions")
        ```
        """
        return self.add_regions(
            label, region, score=score, layer_name=layer_name, id=id, **metadata
        )

    def add_markers(
        self,
        label,
        *markers,
        score=None,
        layer_name="(uncategorized)",
        id=None,
        size=18,
        shape="raindrop",
        border_width=1.5,
        **metadata
    ):
        """
        Add markers to an image.

        Args:
            layer_name: (str) the layer for the label and markers
            label: (str) the label for the markers
            markers: list or tuples of exactly 2 ints (x, y)
            score: (optional, number) a score associated with the markers
            id: (optional, str) an id associated with the markers
            size: (int) size of markers, in pixels
            shape: (str) "raindrop" or "circle"
            border_width: (float) width of border around shapes

        Example:
        ```python
        >>> image = Image()
        >>> point1 = (x1, y1)
        >>> point2 = (x2, y2)
        >>> image.add_markers("Person", point1, point2, score=0.99)
        ```
        """
        if not isinstance(layer_name, str):
            raise Exception("layer_name must be a string")

        if not isinstance(label, str):
            raise Exception("label must be a string")

        self._init_annotations(layer_name)
        self._update_annotations(
            layer_name,
            {
                "label": label,
                "markers": [
                    _verify_marker(marker, shape, size, border_width)
                    for marker in markers
                ],
                "score": score,
                "id": id,
                "metadata": metadata,
            },
        )
        return self

    def add_marker(
        self,
        label,
        marker,
        score=None,
        layer_name="(uncategorized)",
        id=None,
        size=18,
        shape="raindrop",
        border_width=1.5,
        **metadata
    ):
        """
        Add a marker to an image.

        Args:
            layer_name: (str) the layer for the label and marker
            label: (str) the label for the marker
            marker: a list or tuple of exactly 2 ints (x, y)
            score: (optional, number) a score associated with the marker
            id: (optional, str) an id associated with the marker
            size: (int) size of marker, in pixels
            shape: (str) "raindrop" or "circle"
            border_width: (float) width of border around shape

        Example:
        ```python
        >>> image = Image()
        >>> point = (x, y)
        >>> image.add_marker("Person", point, score=0.99)
        ```
        """
        return self.add_markers(
            label,
            marker,
            score=score,
            layer_name=layer_name,
            id=id,
            size=size,
            shape=shape,
            border_width=border_width,
            **metadata
        )

    def add_lines(
        self,
        label,
        *lines,
        score=None,
        layer_name="(uncategorized)",
        id=None,
        **metadata
    ):
        """
        Add lines to an image.

        Args:
            layer_name: (str) the layer for the label and lines
            label: (str) the label for the lines
            lines: list or tuples of exactly 2 points ((x1, y1), (x2, y2))
            score: (optional, number) a score associated with the lines
            id: (optional, str) an id associated with the lines

        Example:
        ```python
        >>> image = Image()
        >>> line1 = [(x1, y1), (x2, y2)]
        >>> line2 = [(x3, y3), (x4, y4)]
        >>> image.add_lines("Person", line1, line2, score=0.99)
        ```
        """
        if not isinstance(layer_name, str):
            raise Exception("layer_name must be a string")

        if not isinstance(label, str):
            raise Exception("label must be a string")

        self._init_annotations(layer_name)
        self._update_annotations(
            layer_name,
            {
                "label": label,
                "lines": [_verify_line(line) for line in lines],
                "score": score,
                "id": id,
                "metadata": metadata,
            },
        )
        return self

    def add_line(
        self, label, line, score=None, layer_name="(uncategorized)", id=None, **metadata
    ):
        """
        Add a line to an image.

        Args:
            layer_name: (str) the layer for the label and line
            label: (str) the label for the line
            line: list or tuple of exactly 2 points ((x1, y1), (x2, y2))
            score: (optional, number) a score associated with the line
            id: (optional, str) an id associated with the line

        Example:
        ```python
        >>> image = Image()
        >>> line = [(x1, y1), (x2, y2)]
        >>> image.add_line("Person", line, score=0.99)
        ```
        """
        return self.add_lines(
            label, line, score=score, layer_name=layer_name, id=id, **metadata
        )

    def add_bounding_boxes(
        self,
        label,
        *boxes,
        score=None,
        layer_name="(uncategorized)",
        id=None,
        **metadata
    ):
        """
        Add bounding boxes to an image.

        Args:
            layer_name: (str) the layer for the label and bounding boxes
            label: (str) the label for the boxes
            boxes: list or tuples of exactly 2 points (top-left, bottom-right),
                or 4 ints (x, y, width, height)
            score: (optional, number) a score associated with the boxes
            id: (optional, str) an id associated with the boxes

        Example:
        ```python
        >>> image = Image()
        >>> box1 = [(x1, y1), (x2, y2)]
        >>> box2 = [x, y, width, height]
        >>> image.add_bounding_boxes("Person", box1, box2, score=0.99, layer_name="Truth")
        >>> image.add_bounding_boxes("Person", box1, score=0.4, layer_name="Prediction)
        ```
        """
        if not isinstance(layer_name, str):
            raise Exception("layer_name must be a string")

        if not isinstance(label, str):
            raise Exception("label must be a string")

        self._init_annotations(layer_name)
        self._update_annotations(
            layer_name,
            {
                "label": label,
                "boxes": [_verify_box(box) for box in boxes],
                "score": score,
                "id": id,
                "metadata": metadata,
            },
        )
        return self

    def add_bounding_box(
        self, label, box, score=None, layer_name="(uncategorized)", id=None, **metadata
    ):
        """
        Add a bounding box to an image.

        Args:
            layer_name: (str) the layer for the label and bounding box
            label: (str) the label for the box
            box: exactly 2 points (top-left, bottom-right),
                or 4 ints (x, y, width, height)
            score: (optional, number) a score associated with the box
            id: (optional, str) an id associated with the box

        Example:
        ```python
        >>> image = Image()
        >>> box = [(x1, y1), (x2, y2)]
        >>> image.add_bounding_box("Person", box, 0.56, layer_name="Truth")
        >>> box = [x, y, w, h]
        >>> image.add_bounding_box("Person", box, 0.04, layer_name="Prediction")
        ```
        """
        return self.add_bounding_boxes(
            label, box, score=score, layer_name=layer_name, id=id, **metadata
        )

    def add_mask(
        self,
        label_map,
        mask,
        scores=None,
        layer_name="(uncategorized)",
        id=None,
        column_first=False,
        **metadata
    ):
        """
        Add a mask to an image.

        Args:
            layer_name: (str) the layer for the labels and mask
            label_map: (dict) dictionary of index (int) to label (string)
            mask: (2D array or np.array with int values, image filename,
                PIL.Image, or kangas.Image) an array in row-first order
                (mask[row][col]) or Image. If column-first order use
                column_first=True
            scores: (optional, dict) a score associated with each label
            id: (optional, str) an id associated with the mask
            column_first: (optional, bool) normally, mask data is given
               in row-first order (mask[row][col]). Use this flag to indicate
               that you are passing in a mask in column-first order

        Example:
        ```python
        >>> import kangas as kg
        >>> import PIL.Image
        >>> image = kg.Image("source.png")
        >>> mask1 = PIL.Image.open("pred.png")
        >>> mask2 = PIL.Image.open("truth.png")
        >>> image.add_mask({23: "person"}, mask1, layer_name="Prediction")
        >>> image.add_mask({23: "person"}, mask2, layer_name="Ground Truth")
        >>> dg = kg.DataGrid(name="model23")
        >>> dg.append([image])
        >>> dg.save()
        ```
        """
        from .mask import Mask

        if not isinstance(layer_name, str):
            raise Exception("layer_name must be a string")

        image = None

        if isinstance(mask, (list, tuple)):
            if column_first:
                width = len(mask)
                height = len(mask[0])
                array = np.array(mask)
                array = array.transpose()
            else:
                array = mask
                height = len(mask)
                width = len(mask[0])
        elif isinstance(mask, Image):
            image = mask.to_pil()
        elif isinstance(mask, str):
            image = PIL.Image.open(mask)
        elif isinstance(mask, PIL.Image.Image):  # PIL.Image
            image = mask
        elif hasattr(mask, "tolist"):  # numpy arrays
            if column_first:
                array = mask.transpose()
                height, width = array.shape
            else:
                array = mask
                width, height = array.shape
        elif isinstance(mask, Mask):
            array = mask.get_array()
            width, height = mask.width, mask.height
        else:
            raise Exception("unknown mask type: %r" % mask)

        if image is not None:
            if image.mode != "P":
                image = image.convert("P")
            image = image.quantize()
            width, height = image.size
            array = np.array(image)
            array = array.flatten().tolist()
        else:
            array = fast_flatten(array, int).tolist()

        self._init_annotations(layer_name)

        rle_array = rle_encode(array)
        if len(rle_array) < len(array):
            array = rle_array
            format = "rle"
        else:
            format = "raw"

        self._update_annotations(
            layer_name,
            {
                "labels": sorted(set(label_map.values())),
                "scores": scores,
                "mask": {
                    "array": array,
                    "format": format,
                    "width": width,
                    "height": height,
                    "map": label_map,
                    "type": "segmentation",
                },
                "id": id,
                "metadata": metadata,
            },
        )
        return self

    def add_mask_metric(
        self,
        label,
        mask,
        score=None,
        colormap="plasma",
        layer_name="(uncategorized)",
        id=None,
        column_first=False,
        colorlevels=64,
        **metadata
    ):
        """
        Add a metric mask to an image.

        Args:
            layer_name: (str) the layer for the label and mask
            label: (str) the label for the mask
            mask: (2D array or np.array with values 0-1, image filename,
                PIL.Image, or kangas.Image) an array in row-first order
                (mask[row][col]) or Image. If column-first order use
                column_first=True
            score: (optional, number) a score associated with the mask
            colormap: (optional, str) the name of the colormap to use
                (see below list)
            colorlevels: maximum number of colors; default of 64
                means that there wil be 64 gradations of the colormap
            id: (optional, str) an id associated with the mask
            column_first: (optional, bool) normally, mask data is given
               in row-first order (mask[row][col]). Use this flag to indicate
               that you are passing in a mask in column-first order

        Notes:

        The possible colormap names are:

        "alpha", "autumn", "bathymetry", "blackbody", "bluered", "bone",
        "cdom", "chlorophyll", "cool", "copper", "cubehelix", "density",
        "earth", "electric", "freesurface-blue", "freesurface-red", "greens",
        "greys", "hot", "hsv", "inferno", "jet", "magma", "oxygen", "par",
        "phase", "picnic", "plasma", "portland", "rainbow", "rainbow-soft",
        "rdbu", "salinity", "spring", "summer", "temperature", "turbidity",
        "velocity-blue", "velocity-green", "viridis", "warm", "winter",
        "yignbu", "yiorrd"

        Example:
        ```python
        >>> import kangas as kg
        >>> import PIL.Image
        >>> image = kg.Image("source.png")
        >>> mask = PIL.Image.open("attention.png")
        >>> image.add_mask_metric("attention", mask)
        >>> dg = kg.DataGrid(name="model23")
        >>> dg.append([image])
        >>> dg.save()
        ```
        """
        if not isinstance(layer_name, str):
            raise Exception("layer_name must be a string")

        image = None

        if isinstance(mask, (list, tuple)):
            if column_first:
                width = len(mask)
                height = len(mask[0])
                array = np.array(mask)
                array = array.transpose()
            else:
                height = len(mask)
                width = len(mask[0])
                array = np.array(mask)
        elif isinstance(mask, Image):
            image = mask.to_pil()
        elif isinstance(mask, str):
            image = PIL.Image.open(mask)
        elif isinstance(mask, PIL.Image.Image):  # PIL.Image
            image = mask
        elif hasattr(mask, "tolist"):  # numpy arrays
            if column_first:
                array = mask.transpose()
                height, width = array.shape
            else:
                array = mask
                width, height = array.shape
        else:
            raise Exception("unknown mask type: %r" % mask)

        if image is not None:
            if image.mode != "P":
                image = image.convert("P")
            image = image.quantize()
            width, height = image.size
            array = np.array(image)
            array = array.flatten()
            # convert 0-255 floats to 0-colorlevels ints
            array = (array / 255 * (colorlevels - 1)).astype(int).tolist()
        else:
            # converts to numpy array too:
            array = fast_flatten(array, float)
            # Set any negative numbers to zero:
            array[array < 0] = 0
            # convert 0.0-1.0 floats to 0-colorlevels ints
            array = (array * (colorlevels - 1)).astype(int).tolist()

        self._init_annotations(layer_name)

        rle_array = rle_encode(array)
        if len(rle_array) < len(array):
            array = rle_array
            format = "rle"
        else:
            format = "raw"

        self._update_annotations(
            layer_name,
            {
                "label": label,
                "score": score,
                "mask": {
                    "array": array,
                    "format": format,
                    "width": width,
                    "height": height,
                    "type": "metric",
                    "colormap": colormap,
                    "colorlevels": colorlevels,
                },
                "id": id,
                "metadata": metadata,
            },
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
    color_order,
):
    # type: (Union[IO[bytes], Any], Optional[str], str, float, Optional[Sequence[int]], Optional[str], Optional[Sequence[float]], str, Optional[Any]) -> Union[IO[bytes], None, Any]
    """
    Ensure that the given image_data is converted to a file_like_object ready
    to be uploaded
    """
    ## Conversion from standard objects to image
    ## Allow file-like objects, numpy arrays, etc.

    image_data = download_filename(image_data)

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
            color_order,
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
            color_order,
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
            color_order,
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
            color_order,
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
    color_order,
):
    # type: (Any, str, float, Optional[Sequence[int]], Optional[str], Optional[Sequence[float]], str) -> Optional[IO[bytes]]
    """
    Convert a numpy array to an in-memory image
    file pointer.
    """
    if isinstance(color_order, str) and color_order.lower() == "bgr":
        array = array[..., ::-1].copy()
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
    from matplotlib import cm

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
