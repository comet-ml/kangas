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

import asyncio
from concurrent.futures import ThreadPoolExecutor

import tornado
import tornado.log
import tornado.options
import tornado.web

from .handlers import datagrid_handlers
from .queries import KANGAS_ROOT  # noqa


def start_tornado_server(port, debug=None, max_workers=None):
    """
    Args:
        port: (int) the port to start the frontend server
        debug: (str) None means suppress output from servers
    """

    async def main():
        if debug is not None:
            tornado.options.options["logging"] = debug
            tornado.log.enable_pretty_logging()

        # set max_workers
        executor = ThreadPoolExecutor(max_workers=max_workers)
        print(
            "Kangas backend server starting with %s max workers" % executor._max_workers
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
        print("Exiting datagrid server")
