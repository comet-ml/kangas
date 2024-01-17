# -*- coding: utf-8 -*-
# *******************************************************
#   ____                     _               _
#  / ___|___  _ __ ___   ___| |_   _ __ ___ | |
# | |   / _ \| '_ ` _ \ / _ \ __| | '_ ` _ \| |
# | |__| (_) | | | | | |  __/ |_ _| | | | | | |
#  \____\___/|_| |_| |_|\___|\__(_)_| |_| |_|_|
#
#  Sign up for free at https://www.comet.com
#  Copyright (C) 2015-2023 Comet ML INC
# *******************************************************

import json
import logging
import tempfile
from collections import defaultdict

from .._typing import Any
from . import math_3d

LOGGER = logging.getLogger(__name__)


def create_thumbnail(
    points, boxes, x, y, z, min_max_x, min_max_y, min_max_z
) -> Any:
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        LOGGER.error(
            "The Python library Pillow is required to generate a 3D Cloud thumbnail"
        )
        return None

    size = (250, 250)
    background_color = (51, 51, 77)

    image = Image.new("RGB", size, background_color)
    canvas = ImageDraw.Draw(image)

    midpoint = [
        (min_max_x[0] + min_max_x[1]) / 2,
        (min_max_y[0] + min_max_y[1]) / 2,
        (min_max_z[0] + min_max_z[1]) / 2,
    ]

    x_range = abs(min_max_x[0] - min_max_x[1])
    y_range = abs(min_max_y[0] - min_max_y[1])

    scale = min(
        size[0] / (x_range if x_range != 0 else 1),
        size[1] / (y_range if y_range != 0 else 1),
    )
    transform = math_3d.identity()
    transform = math_3d.matmul(
        transform, math_3d.translate_xyz(*[-n for n in midpoint])
    )
    transform = math_3d.matmul(transform, math_3d.rotate_z(z))
    transform = math_3d.matmul(transform, math_3d.rotate_x(x))
    transform = math_3d.matmul(transform, math_3d.rotate_y(y))
    transform = math_3d.matmul(transform, math_3d.scale_xyz(scale, scale, scale))
    transform = math_3d.matmul(
        transform, math_3d.translate_xyz(size[0] / 2, size[1] / 2, 0)
    )

    fcanvas = defaultdict(lambda: None)
    for data in points:
        point = data[:3]
        if len(data) > 3:
            color = tuple([int(round(c)) for c in data[3:]])
        else:
            color = (255, 255, 255)
        math_3d.draw_point_fake(size, fcanvas, transform, point, color)

    if fcanvas:
        for x, y in fcanvas:
            color = fcanvas[(x, y)]["color"]
            canvas.point((x, y), fill=color)

    for data in boxes:
        if "color" in data and data["color"]:
            color = tuple(data["color"])
        else:
            color = (255, 255, 255)
        for points in data["segments"]:
            point1 = points[0]
            for point2 in points[1:]:
                math_3d.draw_line(
                    size, canvas, transform, point1, point2, color
                )
                point1 = point2

    return image
