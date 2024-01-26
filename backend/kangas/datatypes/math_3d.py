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

import math
import json
import logging
import tempfile
from collections import defaultdict

from .._typing import Any

LOGGER = logging.getLogger(__name__)


def generate_image_from_points(
        points, boxes, x, y, z, min_max_x, min_max_y, min_max_z, size=(800, 600)
) -> Any:
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        LOGGER.error(
            "The Python library Pillow is required to generate a 3D Cloud image"
        )
        return None

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
    transform = identity()
    transform = matmul(
        transform, translate_xyz(*[-n for n in midpoint])
    )
    transform = matmul(transform, rotate_z(z))
    transform = matmul(transform, rotate_x(x))
    transform = matmul(transform, rotate_y(y))
    transform = matmul(transform, scale_xyz(scale, scale, scale))
    transform = matmul(
        transform, translate_xyz(size[0] / 2, size[1] / 2, 0)
    )

    fcanvas = defaultdict(lambda: None)
    for data in points:
        point = data[:3]
        if len(data) > 3:
            color = tuple([int(round(c)) for c in data[3:]])
        else:
            color = (255, 255, 255)
        draw_point_fake(size, fcanvas, transform, point, color)

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
                draw_line(
                    size, canvas, transform, point1, point2, color
                )
                point1 = point2

    return image


def identity():
    """
    Return matrix for identity (no transforms).
    """
    return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ]


def rotate_x(angle):
    """
    Return transform matrix for rotation around x axis.
    """
    radians = angle * math.pi / 180
    return [
        [1, 0, 0, 0],
        [0, math.cos(radians), -math.sin(radians), 0],
        [0, math.sin(radians), math.cos(radians), 0],
        [0, 0, 0, 1],
    ]


def rotate_y(angle):
    """
    Return transform matrix for rotation around y axis.
    """
    radians = angle * math.pi / 180
    return [
        [math.cos(radians), 0, math.sin(radians), 0],
        [0, 1, 0, 0],
        [-math.sin(radians), 0, math.cos(radians), 0],
        [0, 0, 0, 1],
    ]


def rotate_z(angle):
    """
    Return transform matrix for rotation around z axis.
    """
    radians = angle * math.pi / 180
    return [
        [math.cos(radians), -math.sin(radians), 0, 0],
        [math.sin(radians), math.cos(radians), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ]


def translate_xyz(x, y, z):
    """
    Return transform matrix for translation (linear moving).
    """
    return [
        [1, 0, 0, x],
        [0, 1, 0, y],
        [0, 0, 1, z],
        [0, 0, 0, 1],
    ]


def scale_xyz(x, y, z):
    """
    Return transform matrix for scaling.
    """
    return [
        [x, 0, 0, 0],
        [0, y, 0, 0],
        [0, 0, z, 0],
        [0, 0, 0, 1],
    ]


def matmul(a, b):
    """
    Multiply two matrices. Written in Pure Python
    to avoid dependency on numpy.
    """
    c = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
    for x in range(4):
        for y in range(4):
            acc = 0
            for n in range(4):
                acc += a[n][x] * b[y][n]
            c[y][x] = acc
    return c


def multiply_point_by_matrix(matrix, point):
    """
    Multiply a point by a matrix. Written in Pure Python
    to avoid dependency on numpy.
    """
    return [
        (point[0] * matrix[0][0])
        + (point[1] * matrix[0][1])
        + (point[2] * matrix[0][2])
        + (1 * matrix[0][3]),
        (point[0] * matrix[1][0])
        + (point[1] * matrix[1][1])
        + (point[2] * matrix[1][2])
        + (1 * matrix[1][3]),
        (point[0] * matrix[2][0])
        + (point[1] * matrix[2][1])
        + (point[2] * matrix[2][2])
        + (1 * matrix[2][3]),
    ]


def point_to_canvas(size, point, z=False):
    """
    Convert to screen coordinates (flip horizontally)
    Only return the first two values [x, y] of point
    """
    if z:
        return [int(size[0] - point[0]), int(point[1]), point[2]]
    else:
        return [int(size[0] - point[0]), int(point[1])]


def draw_line(size, canvas, transform, a, b, color):
    """
    Draw a line on the canvas given two points and transform.
    """
    ta = point_to_canvas(size, multiply_point_by_matrix(transform, a))
    tb = point_to_canvas(size, multiply_point_by_matrix(transform, b))
    canvas.line(ta + tb, fill=color)


def draw_point(size, canvas, transform, point, color):
    """
    Draw a point on the canvas given the transform.
    """
    p = point_to_canvas(size, multiply_point_by_matrix(transform, point))
    canvas.point(p, fill=color)


def draw_point_fake(size, fcanvas, transform, point, color):
    """
    Draw a point on the canvas given the transform.
    """
    p = point_to_canvas(size, multiply_point_by_matrix(transform, point), z=True)
    location = fcanvas[(p[0], p[1])]
    if location is None or location["z"] < p[2]:
        fcanvas[(p[0], p[1])] = {"z": p[2], "color": color}
