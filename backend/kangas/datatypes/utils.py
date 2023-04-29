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

import datetime
import functools
import gzip
import io
import logging
import math
import numbers
import os
import re
import shutil
import urllib.parse
import urllib.request
import uuid

import numpy as np
import six

from .._typing import IO, Any

THUMBNAIL_SIZE = (150, 55)  # width, height
RESERVED_NAMES = ["row-id"]
LOGGER = logging.getLogger(__name__)
INFINITY = float("inf")
CONVERSION_METHODS = ["as_py", "to_pydatetime"]


def contain(image, size, method=None):
    """
    Returns a resized version of the image, set to the maximum width
    and height within the requested size, while maintaining the
    original aspect ratio.
    """
    method = method if method is not None else 3  # BICUBIC

    im_ratio = image.width / image.height
    dest_ratio = size[0] / size[1]

    if im_ratio != dest_ratio:
        if im_ratio > dest_ratio:
            new_height = int(image.height / image.width * size[0])
            if new_height != size[1]:
                size = (size[0], new_height)
        else:
            new_width = int(image.width / image.height * size[1])
            if new_width != size[0]:
                size = (new_width, size[1])
    return image.resize(size, resample=method)


def download(url, filename):
    if not os.path.isfile(filename):
        g = urllib.request.urlopen(url)
        with open(filename, "wb") as f:
            f.write(g.read())


def unpack_archive(archive_filename, ext=None):
    if ext is not None:
        filename = archive_filename
    elif "." in archive_filename:
        filename, ext = archive_filename.rsplit(".", 1)
    else:
        filename = archive_filename

    if not os.path.isfile(filename):
        if ext == "gz":
            with open(filename, "wb") as fp:
                with gzip.open(archive_filename, "rb") as fp_gz:
                    fp.write(fp_gz.read())
        elif ext == "zip":
            shutil.unpack_archive(archive_filename, ".", "zip")
        elif ext == "tar":
            shutil.unpack_archive(archive_filename, ".", "tar")
        elif ext == "tgz":
            shutil.unpack_archive(archive_filename, ".", "gztar")
        else:
            filename = archive_filename

    return filename


def download_filename(filename, ext=None):
    """
    Download and/or unzip/un-gzip/un-tar file.
    """
    if not isinstance(filename, str):
        return filename

    if filename.startswith("http"):
        url = filename
        parts = urllib.parse.urlsplit(url)
        # ('http', 'example.com', '/somefile.zip', '', '')
        path = parts[2]
        filename = os.path.basename(path)
        download(url, filename)

    filename = unpack_archive(filename, ext)

    return filename


def make_dict_factory(column_name_map):
    def dict_factory(cursor, row):
        """
        For use with SQLite row access.
        """
        row_dict = {}
        for idx, col in enumerate(cursor.description):
            row_dict[column_name_map[col[0]]] = row[idx]
        return row_dict

    return dict_factory


def all_numbers(item):
    # Possibly nested
    if item is None:
        return True
    elif isinstance(item, numbers.Number):
        return True
    elif isinstance(item, (list, tuple)):
        return all(all_numbers(v) for v in item)
    else:
        return False


def pytype_to_dgtype(item):
    import PIL.Image

    from .serialize import DATAGRID_TYPES

    if is_null(item):
        return None

    if isinstance(item, PIL.Image.Image):
        return "IMAGE-ASSET"

    if isinstance(item, (list, tuple)):
        if all_numbers(item):
            return "VECTOR"
        else:
            return "JSON"

    if hasattr(item, "item") and callable(item.item):
        ## numpy types
        try:
            item = item.item()
        except Exception:
            pass

    if hasattr(item, "tolist") and not isinstance(item, numbers.Number):
        ## numpy arrays
        return "VECTOR"

    for ctype in DATAGRID_TYPES:
        if isinstance(item, tuple(DATAGRID_TYPES[ctype]["types"])):
            return ctype

    raise ValueError("unknown type: %r" % type(item))


def is_nan(value):
    """
    Return True if value is float("NaN")
    """
    return isinstance(value, float) and math.isnan(value)


def is_null(value):
    return value is None or is_nan(value)


def convert_string_to_date(string, datetime_format):
    """
    Attempt to convert a string into a particular type
    of datetime object.

    Args:
        string: (str) the string to attempt to parse into a date
        datetime_format: (str) a datetime format

    Returns:
        A Datetime object if successful, and None otherwise.
    """
    try:
        return datetime.datetime.strptime(string, datetime_format)
    except Exception:
        return None


def convert_row_dict(row_dict, converters):
    """
    For use in doing row-level conversions
    """
    if converters and "row" in converters:
        converters["row"](row_dict)


def apply_converters(value, colname, converters):
    """
    For use in conversion to CSV output
    """
    if converters:
        if colname in converters:
            converter = converters[colname]
            return converter(value)

    if isinstance(value, str):
        return value.replace("\n", "\\n")
    return value


def convert_to_type(value, dg_type):
    """
    Convert to a type, allowing for
    possible later corercion.
    """
    import PIL.Image

    from .image import Image

    # FIXME: is this even needed?
    if dg_type is None or value is None:
        return value
    elif dg_type == "TEXT":
        return str(value)
    elif dg_type == "INTEGER":
        if isinstance(value, (int, float, datetime.date, datetime.datetime)):
            # will convert datetimes later
            return value
        else:
            return int(value)
    elif dg_type == "FLOAT":
        if isinstance(value, (int, float, datetime.date, datetime.datetime)):
            # will convert datetimes later
            return value
        else:
            return float(value)
    elif dg_type == "BOOLEAN":
        if isinstance(value, str):
            if value.lower() in ["true", "t", "1", "yes"]:
                return True
            elif value.lower() in ["false", "f", "0", "no"]:
                return False

        return bool(value)
    elif dg_type == "DATETIME":
        if isinstance(value, (datetime.date, datetime.datetime)):
            return value
        elif isinstance(value, (int, float)):
            return datetime.datetime.fromtimestamp(value)
        else:
            print("Invalid DATETIME: %r; ignoring" % value)
            return None
    elif dg_type == "IMAGE-ASSET":
        if isinstance(value, (PIL.Image.Image,)):
            return Image(value)
        else:
            return value
    else:
        return value


def convert_to_value(
    value, heuristics, datetime_format=None, colname=None, converters=None
):
    if converters:
        if colname in converters:
            converter = converters[colname]
            return converter(value)

    while any([hasattr(value, method) for method in CONVERSION_METHODS]):
        for method in CONVERSION_METHODS:
            if hasattr(value, method):
                value = getattr(value, method)()

    if isinstance(value, str):
        return convert_string_to_value(
            value, heuristics, datetime_format, colname, converters
        )

    return value


def convert_string_to_value(
    value, heuristics, datetime_format=None, colname=None, converters=None
):
    """
    Takes a string, and returns a value of the appropriate time
    for those situations where you don't have type information
    (like a CSV file).

    Args:
        value: (str) a string from a cell in the spreadsheet
        heuristics: (bool) if True, guess numeric datestamps
        datetime_format: (str) the format of dates
        colname: (str) name of column
        converters: dictionary of functions to convert strings
            into values. Keys are str (to match colname)

    Examples:
    ```python
    >>> convert_string_to_value("1") # int
    1
    >>> convert_string_to_value("1.1") # float
    1.1
    >>> convert_string_to_value("True") # str
    True
    >>> convert_string_to_value("12/1/2001") # str
    "12/1/2001"
    >>> convert_string_to_value("12/1/2001", datetime_format="%m/%d/%Y") # datetime
    datetime.datetime(2001, 12, 1, 0, 0)
    >>> convert_string_to_value(111111111) # datetime, heuristics is True
    datetime.date(1973, 7, 10)
    >>> convert_string_to_value(111111111, heuristics=False) # int
    111111111
    ```
    """
    if converters:
        if colname in converters:
            converter = converters[colname]
            return converter(value)

    if value.strip() == "":
        return None

    if heuristics:
        if value.isdigit():
            if len(value) in [9, 10]:  # could be a datetime
                return datetime.datetime.fromtimestamp(int(value))
            elif len(value) in [13, 14]:  # could be a datetime with ms
                return datetime.datetime.fromtimestamp(int(value) / 1000)
        elif value.count(".") == 1 and value.replace(".", "").isdigit():
            int_part, dec_part = value.split(".")
            if len(int_part) in [9, 10]:  # could be a datetime
                return datetime.datetime.fromtimestamp(float(value))
            elif len(int_part) in [13, 14]:  # could be a datetime with ms
                return datetime.datetime.fromtimestamp(float(value) / 1000)

    # scientific notation
    match = re.match(r"^([-+]?[\d]+\.?[\d]*[Ee](?:[-+]?[\d]+)?)$", value)
    if match:
        value = match.groups()[0]
        try:
            return float(value)
        except Exception:
            return value

    # integers, including currency
    match = re.match(r"^[\$]?([-+]?[,\d]+)$", value)
    if match:
        value = match.groups()[0]
        # remove commas:
        value = value.replace(",", "")
        try:
            return int(value)
        except Exception:
            return 0

    # floating point numbers, including currency
    match = re.match(r"^[\$]?([-+]?[,\d]+\.?[\d]*)$", value)
    if match:
        value = match.groups()[0]
        # remove commas:
        value = value.replace(",", "")
        try:
            return float(value)
        except Exception:
            return 0.0

    # specific datetime_format given
    if datetime_format:
        datetime_value = convert_string_to_date(value, datetime_format)
        if datetime_value:
            return datetime_value

    if value.lower() in ["true", "false"]:
        return bool(value)

    # else, keep as string for now
    return value


def sanitize_name(name, delim="-"):
    """
    Remove any unwanted characters and replace with
    the given delimiter.

    Args:
        name: (str) the text to sanitize
        delim: (str) the char to replace unwanted chars

    Returns:
        a sanitized string
    """
    return (
        name.strip()
        .lower()
        .replace(" ", delim)
        .replace("/", delim)
        .replace(":", delim)
        .replace("-", delim)
    )


def create_columns(length):
    """
    Create column names from "A", "B", "C", ...., "AA", "BB", ...
    with initial type None.
    """
    results = {"row-id": "ROW_ID"}
    results.update(
        {
            column_name: None
            for column_name in [make_column_name(i) for i in range(length)]
        }
    )
    return results


def make_column_name(num):
    """
    Create an automatic column name, if one isn't given.

    Args:
        num: (int) number of column

    Returns: a string appropriate for a column name
    """
    char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[num % 26]
    group = (num // 26) + 1
    return char * group


def write_stream_response_to_file(responses, file_object):
    for chunk in responses.iter_content(chunk_size=1024 * 1024):
        file_object.write(chunk)


def generate_guid():
    # type: () -> str
    """Generate a GUID"""
    return uuid.uuid4().hex


def generate_image(asset_data):
    """
    Given the asset data, generate a PIL Image.

    Args:
        asset_data: the raw bytes of an image

    Returns:
        a PIL Image
    """
    from PIL import Image

    image = Image.open(io.BytesIO(asset_data))
    if image.mode not in ["RGBA", "RGB"]:
        image = image.convert("RGB")
    return image


def generate_thumbnail(
    asset_data, size=None, force=False, annotations=None, return_image=False
):
    """
    Given the asset data, generate a thumbnail-sized image
    in the png format.

    NOTE: you should only call this if you know that
        you don't have a thumbnail and know that you
        need one.

    Args:
        asset_data: the raw bytes of an image
        size: (tuple, optional) max (width, height)
        force: (bool, optional) if True, force resize;
            else only if not too small

    Returns:
        bytes of image (PNG if created, but may be the original
        bytes if it is smaller than THUMBNAIL_SIZE).
    """
    from PIL import ImageOps

    size = size if size else THUMBNAIL_SIZE
    image = generate_image(asset_data)

    if not force:
        # Don't force to size given, but make max height:
        new_height = THUMBNAIL_SIZE[1]
        new_width = image.width * new_height // image.height
        new_image = image.resize((new_width, new_height))
    else:
        if hasattr(ImageOps, "contain"):
            new_image = ImageOps.contain(image, size)
        else:
            new_image = contain(image, size)

    if annotations:
        draw_annotations_on_image(new_image, annotations, image.width, image.height)

    fp = image_to_fp(new_image, "png")
    image_data = fp.read()
    if return_image:
        return image_data, new_image
    else:
        return image_data


def get_color(text):
    if not text:
        return "#000000"  # black, error
    # Must return lowercase hex
    # so that getContrastingColor will work
    if text.lower() in ["1", "true", "t", "yes"]:
        return "#12a592"  # green from palette
    if text.lower() in ["0", "false", "f", "no"]:
        return "#cf0057"  # red from palette
    hash = functools.reduce(
        lambda acc, c: ((ord(c) + ((acc << 5) - acc)) & 0x7FFFFFFF), text, 0
    )
    return get_unique_color(abs(hash))


def get_rgb_from_hex(color):
    result = re.match("^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$", color).groups()
    return (
        int(result[0], 16),
        int(result[1], 16),
        int(result[2], 16),
    )


def get_unique_color(hash):
    colors = [
        "#ffd51d",
        "#ffbd00",
        "#ff8900",
        "#fb7628",
        "#ff4747",
        "#e51772",
        "#cf0057",
        "#6e1d89",
        "#860dab",
        "#49a5bd",
        "#0096c7",
        "#00b4d8",
        "#12a592",
        "#16cab2",
        "#41ead4",
    ]
    return colors[hash % len(colors)]


def make_tag(layer_name, label):
    if layer_name == "(uncategorized)":
        return label
    else:
        return "%s: %s" % (layer_name, label)


def draw_annotations_on_image(image, annotations, width, height):
    # annotations: "mask", "boxes", "points", "markers", or "lines"
    from PIL import ImageDraw

    from .colormaps import get_colormap

    canvas = None
    pixels = None

    # assumes images keep aspect ratio
    scale = image.size[0] / width  # scale of thumbnail
    # Draw masks first:
    for annotation_layer in annotations:
        for annotation in annotation_layer["data"]:
            if "mask" in annotation and annotation["mask"]:
                if pixels is None:
                    pixels = image.load()

                mask = annotation["mask"]
                if mask["format"] == "rle":
                    array = rle_decode(mask["array"])
                else:
                    array = mask["array"]
                scale_x = mask["width"] / image.size[0]  # scale of mask
                scale_y = (
                    mask["height"] / image.size[1]
                )  # don't assume it keeps aspect ratio
                if mask["type"] == "segmentation":
                    palette = {
                        int(index): get_rgb_from_hex(
                            get_color(make_tag(annotation_layer["name"], label))
                        )
                        for index, label in mask["map"].items()
                    }
                    # Fill in x,y of thumbnail:
                    for x in range(image.size[0]):
                        for y in range(image.size[1]):
                            # get position from mask:
                            class_value = array[
                                int(y * scale_y) * mask["width"] + int(x * scale_x)
                            ]
                            if class_value in palette:
                                # blend the colors for transparency:
                                pixels[(x, y)] = tuple(
                                    [
                                        int((v1 + v2) / 2)
                                        for v1, v2 in zip(
                                            pixels[(x, y)], palette[class_value]
                                        )
                                    ]
                                )

                if mask["type"] == "metric":
                    colorlevels = mask["colorlevels"] if "colorlevels" in mask else 255
                    colormap = get_colormap(
                        name=mask["colormap"], resolution=colorlevels
                    )

                    for x in range(image.size[0]):
                        for y in range(image.size[1]):
                            # get value from mask:
                            index = array[
                                int(y * scale_y) * mask["width"] + int(x * scale_x)
                            ]
                            if index > 0:
                                rgb = colormap[min(index, len(colormap) - 1)]
                                # blend the colors for transparency:
                                pixels[(x, y)] = tuple(
                                    [
                                        int((v1 + v2) / 2)
                                        for v1, v2 in zip(pixels[(x, y)], rgb)
                                    ]
                                )

    for annotation_layer in annotations:
        for annotation in annotation_layer["data"]:
            if "boxes" in annotation and annotation["boxes"]:
                if canvas is None:
                    canvas = ImageDraw.Draw(image)
                color = get_color(annotation["label"])
                for box in annotation["boxes"]:
                    x, y, w, h = box
                    canvas.rectangle(
                        [
                            (x * scale, y * scale),
                            ((x + w) * scale, (y + h) * scale),
                        ],
                        outline=color,
                    )
            if "points" in annotation and annotation["points"]:
                if canvas is None:
                    canvas = ImageDraw.Draw(image)
                color = get_color(annotation["label"])
                for region in annotation["points"]:
                    canvas.polygon([value * scale for value in region], fill=color)
            if "markers" in annotation and annotation["markers"]:
                pass  # too small to see
            if "lines" in annotation and annotation["lines"]:
                if canvas is None:
                    canvas = ImageDraw.Draw(image)
                color = get_color(annotation["label"])
                for line in annotation["lines"]:
                    x1, y1, x2, y2 = line
                    canvas.line(
                        [(x1 * scale, y1 * scale), (x2 * scale, y2 * scale)],
                        fill=color,
                    )
    return image


def is_valid_file_path(file_path):
    # type: (Any) -> bool
    """Check if the given argument is corresponding to a valid file path,
    ready for reading
    """
    try:
        if os.path.isfile(file_path):
            return True
        else:
            return False
    # We can receive lots of things as arguments
    except (TypeError, ValueError):
        return False


def fix_special_floats(value, _inf=INFINITY, _neginf=-INFINITY):
    """Fix out of bounds floats (like infinity and -infinity) and Not A
    Number.
    Returns either a fixed value that could be JSON encoded or the original
    value.
    """

    try:
        value = convert_tensor_to_numpy(value)

        # Check if the value is Nan, equivalent of math.isnan
        if math.isnan(value):
            return "NaN"

        elif value == _inf:
            return "Infinity"

        elif value == _neginf:
            return "-Infinity"

    except Exception:
        # Value cannot be compared
        return value

    return value


def convert_tensor_to_numpy(tensor):
    """
    Convert from various forms of pytorch tensors
    to numpy arrays.

    Note: torch tensors can have both "detach" and "numpy"
    methods, but numpy() alone will fail if tensor.requires_grad
    is True.
    """
    if hasattr(tensor, "detach"):  # pytorch tensor with attached gradient
        tensor = tensor.detach()

    if hasattr(tensor, "numpy"):  # pytorch tensor
        tensor = tensor.numpy()

    return tensor


def get_file_extension(file_path):
    if file_path is None:
        return None

    ext = os.path.splitext(file_path)[1]
    if not ext:
        return None

    # Get rid of the leading "."
    return ext[1::]


def rescale_array(array, old_range, new_range, dtype):
    """
    Given a numpy array in an old_range, rescale it
    into new_range, and make it an array of dtype.
    """
    old_min, old_max = old_range
    if array.min() < old_min or array.max() > old_max:
        ## truncate:
        array = np.clip(array, old_min, old_max)
    new_min, new_max = new_range
    old_delta = float(old_max - old_min)
    new_delta = float(new_max - new_min)
    if old_delta == 0:
        return ((array - old_min) + (new_min + new_max) / 2.0).astype(dtype)
    else:
        return (new_min + (array - old_min) * new_delta / old_delta).astype(dtype)


def lazy_flatten(iterable):
    if hasattr(iterable, "flatten"):
        iterable = iterable.flatten()
    iterator, sentinel, stack = iter(iterable), object(), []
    while True:
        value = next(iterator, sentinel)
        if value is sentinel:
            if not stack:
                break
            iterator = stack.pop()
        elif isinstance(value, (numbers.Number, six.string_types)):
            yield value
        else:
            if hasattr(value, "flatten"):
                value = value.flatten()  # type: ignore
            try:
                new_iterator = iter(value)
            except TypeError:
                yield value
            else:
                stack.append(iterator)
                iterator = new_iterator


def flatten(items):
    """
    Given a nested list or a numpy array,
    return the data flattened.
    """
    if isinstance(items, (numbers.Number, six.string_types)):
        return items
    return list(lazy_flatten(items))


def fast_flatten(items, dtype=float):
    """
    Given a nested list or a numpy array,
    return the data flattened.
    """
    if isinstance(items, (numbers.Number, six.string_types)):
        return items

    try:
        items = convert_tensor_to_numpy(items)
    except Exception:
        LOGGER.debug("unable to convert tensor; continuing", exc_info=True)

    try:
        # Vector, Matrix conversion:
        items = np.array(items, dtype=dtype)
        # Return numpy array:
        return items.reshape(-1)
    except Exception:
        try:
            # Uneven conversion, 2 deep:
            items = np.array([np.array(item) for item in items], dtype=dtype)
            return items.reshape(-1)
        except Exception:
            # Fall through
            LOGGER.debug("numpy unable to convert items in fast_flatten", exc_info=True)
            return np.array(flatten(items), dtype=dtype)


def image_to_fp(image, image_format):
    # type: (Any, str) -> IO[bytes]
    """
    Convert a PIL.Image into an in-memory file
    pointer.
    """
    fp = io.BytesIO()
    image.save(fp, format=image_format)  # save the content to fp
    fp.seek(0)
    return fp


def _verify_box(box):
    """
    Ensure that a box is [x, y, width, height]
    """
    if len(box) == 2:  # old style [[x1, y1], [x2, y2]]
        x, y = box[0]
        x2, y2 = box[1]
        width = x2 - x
        height = y2 - y
    elif len(box) == 4:  # new style [x, y, width, height]
        x, y, width, height = box
    else:
        raise Exception("Invalid bounding box format: %r" % box)

    return [x, y, width, height]


def _verify_line(line):
    """
    Ensure that a line is [x1, y1, x2, y2]
    """
    if len(line) == 2:  # [[x1, y1], [x2, y2]]
        x1, y1 = line[0]
        x2, y2 = line[1]
    elif len(line) == 4:  # [x1, y1, x2, y2]
        x1, y1, x2, y2 = line
    else:
        raise Exception("Invalid line format: %r" % line)

    return [x1, y1, x2, y2]


def _verify_marker(marker, shape, size, border_width):
    return {
        "shape": shape,
        "borderWidth": border_width,
        "size": size,
        "x": marker[0],
        "y": marker[1],
    }


def rle_encode(sequence):
    """
    Run-length encoding of a given sequence.
    """
    encoding = [sequence[0], 1]
    for value in sequence[1:]:
        if value == encoding[-2]:
            encoding[-1] += 1
        else:
            encoding.extend((value, 1))
    return encoding


def rle_decode(encoding):
    """
    Run-length decoding of a given encoding.
    """
    sequence = []
    for index in range(0, len(encoding), 2):
        value, count = encoding[index : index + 2]
        sequence.extend([value] * count)
    return sequence


def compress(series, precision=0):
    if not isinstance(series, list):
        raise ValueError("Input to compress should be of type list.")

    if not isinstance(precision, int):
        raise ValueError("Precision parameter needs to be a number.")

    if precision < 0 or precision > 10:
        raise ValueError("Precision must be between 0 to 10 decimal places.")

    # Store precision value at the beginning of the compressed text
    last_num = 0
    result = io.StringIO(chr(precision + 63))

    for num in series:
        diff = num - last_num
        diff = int(round(diff * (10**precision)))
        diff = ~(diff << 1) if diff < 0 else diff << 1

        while diff >= 0x20:
            result.write(chr((0x20 | (diff & 0x1F)) + 63))
            diff >>= 5

        result.write(chr(diff + 63))
        last_num = num

    return result.getvalue()


def decompress(text):
    if not isinstance(text, str):
        raise ValueError("Input to decompress should be of type str.")

    # decode precision value
    precision = ord(text[0]) - 63

    if precision < 0 or precision > 10:
        raise ValueError(
            "Invalid string sent to decompress. Please check the string for accuracy."
        )

    result = []
    index = 1
    last_num = 0

    while index < len(text):
        index, diff = decompress_number(text, index)
        last_num += diff
        result.append(last_num)

    return [round(item * (10 ** (-precision)), precision) for item in result]


def decompress_number(text, index):
    result = 1
    shift = 0

    while True:
        b = ord(text[index]) - 63 - 1
        index += 1
        result += b << shift
        shift += 5

        if b < 0x1F:
            break

    return index, (~result >> 1) if (result & 1) != 0 else (result >> 1)


def get_annotations_from_layers(layers, name):
    for layer in layers:
        if layer["name"] == name:
            return layer["data"]
    return None


def get_annotation_layer_names(layers):
    return [layer["name"] for layer in layers]


def get_labels_from_annotations(annotations):
    labels = []
    for annotation in annotations:
        if "mask" in annotation and annotation["mask"]:
            if annotation["mask"]["type"] == "segmentation":
                if "labels" in annotation:
                    labels.extend(annotation["labels"])
    return labels


def get_mask_from_annotations(annotations, label):
    for annotation in annotations:
        if "mask" in annotation and annotation["mask"]:
            if annotation["mask"]["type"] == "segmentation":
                if "labels" in annotation and label in annotation["labels"]:
                    return annotation["mask"]
    return None


def expand_mask(mask, label):
    if mask["format"] == "rle":
        array = rle_decode(mask["array"])
    else:
        array = mask["array"]
    # mask["map"] {1: "person", 14: "person"}
    # only interested in label
    indices = [int(index) for index in mask["map"] if mask["map"][index] == label]
    return np.array([value in indices for value in array])


def is_comment(line):
    if line.startswith("#"):
        return True, line[1:].lstrip()
    return False, line


def is_quote(line):
    if line.startswith("'''"):
        return True
    elif line.startswith('"""'):
        return True
    return False


# Python to markdown


def python_to_markdown(filename):
    """
    Open a python script, and return it as markdown
    """
    mode = "code"
    markdown = ""
    start_state = True
    with open(filename) as fp:
        line = fp.readline()
        while line:
            # markdown += "%s:" % mode
            if line == "\n":
                # stay in same mode for now
                markdown += line
            elif "coding: utf-8" in line:
                mode = "pre"
                markdown += "<pre>\n"
            elif mode == "pre":
                if line.startswith("#"):
                    markdown += line
                else:
                    markdown += "</pre>\n"
                    mode = "code"
                    continue
            elif mode == "quote":
                if is_quote(line):
                    mode = "code"
                    start_state = True
                else:
                    markdown += line
            else:
                if is_quote(line):
                    mode = "quote"
                elif mode == "code":
                    comment_q, text = is_comment(line)
                    if comment_q:
                        # end code
                        if not start_state:
                            markdown += "```\n"
                        mode = "comment"
                        # removed comment start
                        markdown += "\n" + text
                    else:  # still code
                        if start_state:
                            markdown += "```python\n"
                        markdown += line
                elif mode == "comment":
                    comment_q, text = is_comment(line)
                    if comment_q:
                        markdown += text
                    else:
                        # end comment; start code
                        mode = "code"
                        markdown += "\n```python\n"
                        markdown += line
                else:
                    raise Exception("Unknown mode: %s" % mode)
                start_state = False
            line = fp.readline()
        # End all
        if mode == "code":
            markdown += "```\n"

    return markdown
