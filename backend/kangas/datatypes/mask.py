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

import math
import random

from .utils import _verify_box


def distance(p1, p2):
    x1, y1 = p1
    x2, y2 = p2
    return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)


def avg(list_of_numbers):
    return sum(list_of_numbers) / len(list_of_numbers)


def flatten(mask):
    import itertools

    return list(itertools.chain(*mask))


class Mask:
    def __init__(self, size):
        self.width, self.height = size
        self._mask = [[0 for col in range(self.width)] for row in range(self.height)]
        self._labels = {}

    def _next_label_id(self):
        if self._labels:
            return max(self._labels.values()) + 1
        else:
            return 1

    def get_array(self):
        return self._mask

    def get_label_map(self):
        return {self._labels[label]: label for label in self._labels}

    def get_label_id(self, label):
        if label not in self._labels:
            self._labels[label] = self._next_label_id()
        return self._labels[label]

    def _verify_list(self, xys, flat=False):
        points = [self._verify([xys[i], xys[i + 1]]) for i in range(0, len(xys), 2)]
        if flat:
            return flatten(points)
        else:
            return points

    def _verify(self, xy):
        x, y = xy
        return [min(max(x, 0), self.width - 1), min(max(y, 0), self.height - 1)]

    def add_bounding_boxes(self, label, *boxes, score=None, overwrite=True):
        for box in boxes:
            self.add_bounding_box(label, box, score=score, overwrite=overwrite)

    def add_bounding_box(self, label, box, score=None, overwrite=True):
        x, y, w, h = _verify_box(box)
        p1 = self._verify([int(x), int(y)])
        p2 = self._verify([int(x + w), int(y + h)])
        value = self.get_label_id(label)
        for row in range(p1[1], p2[1]):
            for col in range(p1[0], p2[0]):
                if overwrite or self._mask[row][col] == 0:
                    self._mask[row][col] = value

    def add_regions(self, label, *points_list, score=None, overwrite=True):
        for points in points_list:
            self.add_region(label, points, score=score, overwrite=overwrite)

    def add_region(self, label, points, score=None, overwrite=True):
        import matplotlib.path

        polygon = matplotlib.path.Path(points, closed=True)
        value = self.get_label_id(label)
        for row in range(self.height):
            for col in range(self.width):
                if overwrite or self._mask[row][col] == 0:
                    if polygon.contains_point([col, row]):
                        self._mask[row][col] = value

    def add_circle(self, center, radius, label, score=None):
        value = self.get_label_id(label)
        for row in range(self.height):
            for col in range(self.width):
                d = distance([col, row], center)
                if d < radius:
                    self._mask[row][col] = value

    def live(self, threshold=3, radius=1):
        # game of life
        new_mask = [
            [self._mask[row][col] for col in range(self.width)]
            for row in range(self.height)
        ]
        for row in range(self.height):
            for col in range(self.width):
                near = self.neighbors([col, row], radius)
                if len(near) >= threshold:
                    new_mask[row][col] = int(avg(near))
        self._mask = new_mask

    def die(self, threshold=3, radius=1):
        # game of life
        new_mask = [
            [self._mask[row][col] for col in range(self.width)]
            for row in range(self.height)
        ]
        for row in range(self.height):
            for col in range(self.width):
                near = self.neighbors([col, row], radius)
                if len(near) <= threshold:
                    new_mask[row][col] = 0
        self._mask = new_mask

    def neighbors(self, col_row, radius):
        col, row = col_row
        # neighbors that are alive (not zero)
        retval = []
        for x in range(-radius, radius + 1):
            for y in range(-radius, radius + 1):
                if (
                    ((x + col >= 0) and (x + col < self.width))
                    and ((y + row >= 0) and (y + row < self.height))
                    and (not ((x == 0) and (y == 0)))
                    and self._mask[row][col] > 0
                ):
                    retval.append(self._mask[row][col])
        return retval

    def threshold(self, lower=None, upper=None, new_value=None):
        for row in range(self.height):
            for col in range(self.width):
                if lower is not None and self._mask[row][col] < lower:
                    self._mask[row][col] = new_value
                elif upper is not None and self._mask[row][col] > upper:
                    self._mask[row][col] = new_value

    def add_gaussian(self, center, radius=None, mu=None, sigma=None, score=None):
        import statistics

        center = [int(v) for v in center]
        radius = int(radius if radius else max(self.width / 2, self.height / 2))
        mu = mu if mu else 1.0
        sigma = sigma if sigma else 0.5
        distribution = statistics.NormalDist(mu=mu, sigma=sigma)
        max_dist = int(distance([0, 0], [radius, radius]))
        for row in range(self.height):
            for col in range(self.width):
                d = distance([col, row], center)
                if d < radius:
                    if self._mask[row][col]:
                        self._mask[row][col] = (
                            self._mask[row][col] + distribution.pdf(1 - d / max_dist)
                        ) / 2
                    else:
                        self._mask[row][col] = distribution.pdf(1 - d / max_dist)
                    self._mask[row][col] = min(self._mask[row][col], 1.0)

    def gitter(self, radius=2):
        new_mask = [
            [self._mask[row][col] for col in range(self.width)]
            for row in range(self.height)
        ]
        for row in range(self.height):
            for col in range(self.width):
                x, y = self._verify(
                    [
                        col + random.randint(-radius, radius + 1),
                        row + random.randint(-radius, radius + 1),
                    ]
                )
                new_mask[row][col], new_mask[y][x] = (
                    self._mask[y][x],
                    self._mask[row][col],
                )
        self._mask = new_mask

    def _value_to_char(self, value, max_value):
        colors = list(
            reversed(
                '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~i!lI;:,"^`. '
            )
        )
        index = min(int((value / max_value) * len(colors)), len(colors) - 1)
        return colors[index]

    def show(self, max_value=None):
        max_value = max_value if max_value is not None else max(flatten(self._mask))
        max_value = 1 if max_value == 0 else max_value
        for row in range(self.height):
            for col in range(self.width):
                print(self._value_to_char(self._mask[row][col], max_value), end="")
            print()
        print()
