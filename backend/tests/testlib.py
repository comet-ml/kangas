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

import os
import time
from contextlib import contextmanager

MAX_TRY_SECONDS = 20


class AlwaysEquals():
    def __eq__(self, other):
        return True

    def __ne__(self, other):
        return False


@contextmanager
def environ(env):
    """Temporarily set environment variables inside the context manager and
    fully restore previous environment afterwards
    """
    original_env = {key: os.getenv(key) for key in env}
    os.environ.update(env)
    try:
        yield

    finally:
        for key, value in original_env.items():
            if value is None:
                del os.environ[key]
            else:
                os.environ[key] = value


def until(function, sleep=0.1):
    """
    Try assert function(). 20 seconds max
    """
    start_time = time.time()
    while not function():
        if (time.time() - start_time) > MAX_TRY_SECONDS:
            return False
        time.sleep(sleep)
    return True


def assert_until_equals(function, value, sleep=0.1):
    """
    Try assert function(). 20 seconds max
    """
    result = function()
    start_time = time.time()
    while result != value:
        if (time.time() - start_time) > MAX_TRY_SECONDS:
            assert False, "%r != %r" % (result, value)
        time.sleep(sleep)
        result = function()


def assert_until_not_equals(function, value, sleep=0.1):
    """
    Try max_tries, assert function(). 20 seconds max
    """
    result = function()
    start_time = time.time()
    while result == value:
        if (time.time() - start_time) > MAX_TRY_SECONDS:
            assert False
        time.sleep(sleep)
        result = function()


def until_asserts(function, sleep=0.1):
    """
    Try max_tries, function(). function() is expected to call assert. 20 seconds max
    """
    start_time = time.time()
    while True:
        try:
            result = function()
            return result
        except AssertionError:
            if (time.time() - start_time) > MAX_TRY_SECONDS:
                raise

            time.sleep(sleep)
