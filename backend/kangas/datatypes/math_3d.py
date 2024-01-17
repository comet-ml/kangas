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
