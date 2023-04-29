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

import os

from .queries import KANGAS_ROOT  # noqa


def start_tornado_server(port, debug_level=None, max_workers=None):
    """
    Args:
        port: (int) the port to start the frontend server
        debug_level: (str) None means suppress output from servers
    """
    import asyncio
    from concurrent.futures import ThreadPoolExecutor

    import tornado
    import tornado.log
    import tornado.options
    import tornado.web

    from .tornado_server import datagrid_handlers

    async def main():
        if debug_level is not None:
            tornado.options.options["logging"] = debug_level
            tornado.log.enable_pretty_logging()

        # set max_workers
        executor = ThreadPoolExecutor(max_workers=max_workers)
        print(
            "Kangas tornado backend server starting with %s max workers"
            % executor._max_workers
        )
        for handler in datagrid_handlers:
            handler[1].executor = executor

        app = tornado.web.Application(datagrid_handlers)
        app.listen(port)
        await asyncio.Event().wait()

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print()
        print("Exiting Kangas tornado backend server")


def start_flask_server(host, port, debug_level=None, max_workers=None):
    from .flask_server import run

    if max_workers is None:
        max_workers = min(32, os.cpu_count() + 4)

    print("Kangas flask backend server starting with %s max workers" % max_workers)
    try:
        run(
            host=host,
            port=port,
            debug_level=debug_level,
            max_workers=max_workers,
        )
    except KeyboardInterrupt:
        print()
        print("Exiting Kangas flask backend server")
