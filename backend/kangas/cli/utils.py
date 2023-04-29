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


class Options:
    def __init__(self, key_values):
        self._dict = {}
        for key_value in key_values:
            self.put(key_value)

    def put(self, key_value):
        key, value = key_value.split("=")
        self._dict[key.strip()] = value.strip()

    def get(self, key, default=None):
        if key in self._dict:
            return self._dict[key]
        else:
            return default
