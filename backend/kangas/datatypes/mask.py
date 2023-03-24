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

import math
import random

from .utils import _verify_box


def distance(p1, p2):
    x1, y1 = p1
    x2, y2 = p2
    return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)


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

    def get_label_id(self, label):
        if label not in self._labels:
            self._labels[label] = self._next_label_id()
        return self._labels[label]

    def add_bounding_box(self, label, box, score=None):
        x, y, w, h = _verify_box(box)
        p1 = [x, y]
        p2 = [x + w, y + h]
        value = self.get_label_id(label)
        for row in range(p1[1], p2[1]):
            for col in range(p1[0], p2[0]):
                self._mask[row][col] = value

    def add_circle(self, center, radius, label, score=None):
        value = self.get_label_id(label)
        for row in range(self.height):
            for col in range(self.width):
                d = distance([col, row], center)
                if d < radius:
                    self._mask[row][col] = value

    def add_gaussian(self, center, label, mu=None, sigma=None, score=None):
        import statistics

        # value = self.get_label_id(label)
        mu = mu if mu else 1.0
        sigma = sigma if sigma else 0.5
        distribution = statistics.NormalDist(mu=mu, sigma=sigma)
        max_dist = distance([0, 0], [self.width / 2, self.height / 2])
        for row in range(self.height):
            for col in range(self.width):
                d = distance([row, col], center)
                self._mask[row][col] = distribution.pdf(1 - d / max_dist)

    def gitter(self, radius=2):
        # For better effect, do from inside out
        for row in range(self.height):
            for col in range(self.width):
                x = max(
                    min(col + random.randint(-radius, radius + 1), self.width - 1), 0
                )
                y = max(
                    min(row + random.randint(-radius, radius + 1), self.height - 1), 0
                )
                self._mask[row][col], self._mask[y][x] = (
                    self._mask[y][x],
                    self._mask[row][col],
                )

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
