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

import datetime
import gzip
import io
import logging
import math
import numbers
import os
import re
import shutil
import urllib
import uuid

import numpy as np
import six

from .._typing import IO, Any

THUMBNAIL_SIZE = (100, 55)  # width, height
RESERVED_NAMES = ["ROW-ID"]
LOGGER = logging.getLogger(__name__)
INFINITY = float("inf")


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


def pytype_to_dgtype(item):
    import PIL.Image

    from .serialize import DATAGRID_TYPES

    if is_null(item):
        return None

    if hasattr(item, "item") and callable(item.item):
        ## numpy types
        item = item.item()

    if isinstance(item, PIL.Image.Image):
        return "IMAGE-ASSET"

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
        return float(value)

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
    return image


def generate_thumbnail(asset_data, size=None):
    """
    Given the asset data, generate a thumbnail-sized image
    in the png format.

    NOTE: you should only call this if you know that
        you don't have a thumbnail and know that you
        need one.

    Args:
        asset_data: the raw bytes of an image

    Returns:
        bytes of image (PNG if created, but may be the original
        bytes if it is smaller than THUMBNAIL_SIZE).
    """
    from PIL import ImageOps

    size = size if size else THUMBNAIL_SIZE
    image = generate_image(asset_data)
    if hasattr(ImageOps, "contain"):
        new_image = ImageOps.contain(image, size)
    else:
        new_image = contain(image, size)
    fp = image_to_fp(new_image, "png")
    return fp.read()


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


def fast_flatten(items):
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
        items = np.array(items, dtype=float)
        # Return numpy array:
        return items.reshape(-1)
    except Exception:
        try:
            # Uneven conversion, 2 deep:
            items = np.array([np.array(item) for item in items], dtype=float)
            return items.reshape(-1)
        except Exception:
            # Fall through
            LOGGER.debug("numpy unable to convert items in fast_flatten", exc_info=True)
            return np.array(flatten(items))


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
