#!/usr/bin/env python
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

import argparse
import os
import subprocess
import sys
import time
import urllib
import webbrowser
from threading import Thread

import kangas.server
from kangas import get_localhost, terminate
from kangas.datatypes.utils import download_filename

ADDITIONAL_ARGS = False
HERE = os.path.abspath(os.path.dirname(__file__))


def get_parser_arguments(parser):
    parser.add_argument(
        "DATAGRID",
        help="Open a particular DataGrid; optional, you can select which DataGrid to use in UI",
        type=str,
        nargs="?",
        default=None,
    )
    parser.add_argument(
        "--filter",
        help="A filter to be applied to a given DataGrid",
        type=str,
        default=None,
    )
    parser.add_argument(
        "--group",
        help="Group to be applied to a given DataGrid",
        type=str,
        default=None,
    )
    parser.add_argument(
        "--sort",
        help="Sort order to be applied to a given DataGrid",
        type=str,
        default=None,
    )
    parser.add_argument(
        "-r",
        "--root",
        help="The directory from which to server datagrid files; also can use KANGAS_ROOT env variable",
        type=str,
        default=None,
    )
    parser.add_argument(
        "-b",
        "--backend",
        help="The backend to use; use 'no' for no backend",
        type=str,
        default="flask",
    )
    parser.add_argument(
        "-bp",
        "--backend-port",
        help="The backend port to use; default is frontend port + 1",
        type=int,
        default=None,
    )
    parser.add_argument(
        "-f",
        "--frontend",
        help="The frontend to use; use 'no' for no frontend",
        type=str,
        default="next",
    )
    parser.add_argument(
        "-fp",
        "--frontend-port",
        help="The frontend port to use",
        type=int,
        default=4000,
    )
    parser.add_argument(
        "-fr",
        "--frontend-root",
        help="Use this setting to change the ROOT path for the frontend (eg, PROTOCOL://HOST:PORT/ROOT); requires a router",
        type=str,
        default=None,
    )
    parser.add_argument(
        "-o",
        "--open",
        help="How to open page in a webbrowser; 'tab', 'window', or 'no'",
        type=str,
        default="tab",
    )
    parser.add_argument(
        "-fh",
        "--host",
        help="The name or IP the frontend server will listen on",
        type=str,
        default=None,
    )
    parser.add_argument(
        "-bh",
        "--backend-host",
        help="The name or IP the backend server will listen on",
        type=str,
        default=None,
    )
    parser.add_argument(
        "--max-workers",
        help="Use this flag to set the backend max_workers",
        default=None,
        type=int,
    )
    parser.add_argument(
        "--debug",
        help="Use this flag to set display to DEBUG for output from servers",
        default=None,
        action="store_true",
    )
    parser.add_argument(
        "--debug-level",
        help="Use this flag to set level of output from servers: DEBUG, INFO, WARNING, ERROR, or CRITICAL",
        type=str,
        default=None,
    )
    parser.add_argument(
        "--terminate",
        help="Kill the Kangas servers",
        default=False,
        action="store_true",
    )
    parser.add_argument(
        "--protocol",
        help="Use this flag to set the protocol for frontend server requests. Defaults to `http`",
        type=str,
        default="http",
    )
    parser.add_argument(
        "--backend-protocol",
        help="Use this flag to set the protocol for backend server requests. Defaults to `http`",
        type=str,
        default="http",
    )
    parser.add_argument(
        "--hide-selector",
        help="Use this flag to hide the DataGrid selector. Default is to show the selector",
        default=False,
        action="store_true",
    )
    parser.add_argument(
        "--type",
        help="If you are viewing a non-datagrid filename that doesn't have appropriate extension, set the type",
        type=str,
        default=None,
    )


def clean_root_path(root_path):
    # frontend root (if given) must start with a / and not end with a slash
    if root_path:
        if root_path == "/":
            return ""
        if "/" not in root_path[0]:
            root_path = "/" + root_path
        if root_path[-1] == "/":
            root_path = root_path[:-1]
        return root_path
    else:
        return ""


def server(parsed_args, remaining=None):
    # Called via `kangas server ...`
    try:
        import nodejs
    except Exception:
        nodejs = None

    if parsed_args.debug_level is not None:
        debug_level = parsed_args.debug_level.upper()
    elif parsed_args.debug is not None:
        debug_level = "INFO"
    else:
        debug_level = None

    # Frontend:
    KANGAS_FRONTEND_PROTOCOL = parsed_args.protocol
    KANGAS_FRONTEND_PORT = parsed_args.frontend_port
    KANGAS_FRONTEND_HOST = (
        parsed_args.host if parsed_args.host is not None else get_localhost()
    )
    KANGAS_FRONTEND_ROOT = clean_root_path(parsed_args.frontend_root)

    # Backend:
    KANGAS_BACKEND_PROTOCOL = parsed_args.backend_protocol
    if parsed_args.backend_port is None:
        KANGAS_BACKEND_PORT = parsed_args.frontend_port + 1
    else:
        KANGAS_BACKEND_PORT = parsed_args.backend_port
    KANGAS_BACKEND_HOST = (
        parsed_args.backend_host
        if parsed_args.backend_host is not None
        else get_localhost()
    )
    KANGAS_HIDE_SELECTOR = 1 if parsed_args.hide_selector else 0

    if parsed_args.terminate:
        terminate()
        return

    print(
        "Serving DataGrids from directory: %r"
        % (parsed_args.root or kangas.server.KANGAS_ROOT)
    )

    if parsed_args.frontend != "no":
        NODE_SERVER_PATH = os.path.join(HERE, "../frontend/standalone/server.js")
        print(
            "Kangas frontend is now running on %s://%s:%s%s/..."
            % (
                KANGAS_FRONTEND_PROTOCOL,
                KANGAS_FRONTEND_HOST,
                KANGAS_FRONTEND_PORT,
                KANGAS_FRONTEND_ROOT,
            )
        )
        # node uses PORT to listen on; this is a local process
        # so shouldn't effect any other node servers

        env = os.environ.copy()
        env.update(
            {
                "NODE_ENV": "production",
                "PORT": str(KANGAS_FRONTEND_PORT),
                "KANGAS_BACKEND_PORT": str(KANGAS_BACKEND_PORT),
                "KANGAS_FRONTEND_HOST": str(KANGAS_FRONTEND_HOST),
                "KANGAS_FRONTEND_PROTOCOL": KANGAS_FRONTEND_PROTOCOL,
                "KANGAS_BACKEND_HOST": str(KANGAS_BACKEND_HOST),
                "KANGAS_BACKEND_PROTOCOL": KANGAS_BACKEND_PROTOCOL,
                "KANGAS_HIDE_SELECTOR": str(KANGAS_HIDE_SELECTOR),
            }
        )
        # Only add these if they are set:
        if KANGAS_FRONTEND_ROOT:
            print("WARNING: requires a router")
            env["KANGAS_FRONTEND_ROOT"] = KANGAS_FRONTEND_ROOT

        if nodejs is not None:
            if hasattr(nodejs, "node"):  # version 18
                result = nodejs.node.call(
                    ["--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )
            else:  # version 16
                import nodejs.node

                result = nodejs.node.run(["--version"])
        else:
            result = 1

        if result == 0:  # Good! We'll use the pip-installed nodejs
            if hasattr(hasattr(nodejs, "node"), "Popen"):  # version 18
                if debug_level is None:
                    node_process = nodejs.node.Popen(
                        [NODE_SERVER_PATH],
                        env=env,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                else:
                    node_process = nodejs.node.Popen([NODE_SERVER_PATH], env=env)
            else:  # version 16
                node_folder, _ = os.path.split(nodejs.node.__file__)
                if sys.platform == "win32":
                    executable = os.path.join(node_folder, "node.exe")
                else:
                    executable = os.path.join(node_folder, "bin/node")

                if debug_level is None:
                    node_process = subprocess.Popen(
                        [executable, NODE_SERVER_PATH],
                        env=env,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                else:
                    node_process = subprocess.Popen(
                        [executable, NODE_SERVER_PATH], env=env
                    )

        else:  # Nope, we'll look for node in the path
            executable = "node.exe" if sys.platform == "win32" else "node"
            result = subprocess.call([executable, "--version"])

            if result == 1:
                raise Exception("Unable to find node executable")

            if debug_level is None:
                node_process = subprocess.Popen(
                    [executable, NODE_SERVER_PATH],
                    env=env,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            else:
                node_process = subprocess.Popen([executable, NODE_SERVER_PATH], env=env)

    if parsed_args.open != "no":
        new = {"tab": 0, "window": 1}[parsed_args.open]
        host = "%s://%s:%s%s/" % (
            KANGAS_FRONTEND_PROTOCOL,
            KANGAS_FRONTEND_HOST,
            KANGAS_FRONTEND_PORT,
            KANGAS_FRONTEND_ROOT,
        )
        query_vars = {}
        if parsed_args.DATAGRID is not None:
            filename = download_filename(parsed_args.DATAGRID)
            if parsed_args.type is not None:
                file_type = parsed_args.type
            elif "." in filename:
                basefile, file_type = filename.rsplit(".", 1)
            else:
                raise Exception("unknown file type")

            if file_type == "datagrid":
                # Nothing to do; already a datagrid
                pass
            elif file_type == "csv":
                dg = kangas.read_csv(filename)
                dg.save()
                filename = dg.filename
            elif file_type == "json":
                dg = kangas.read_json(filename)
                dg.save()
                filename = dg.filename
            else:
                raise Exception("Unknown file type: %r" % file_type)

            query_vars["datagrid"] = filename
            query_vars["timestamp"] = os.path.getmtime(filename)
            if parsed_args.filter:
                query_vars["filter"] = parsed_args.filter
            if parsed_args.group:
                query_vars["group"] = parsed_args.group
            if parsed_args.sort:
                query_vars["sort"] = parsed_args.sort
        if query_vars:
            url = "%s?%s" % (host, urllib.parse.urlencode(query_vars))
        else:
            url = host

        def open_webbrowser():
            time.sleep(1.0)
            webbrowser.open(url, new=new, autoraise=True)

        thread = Thread(target=open_webbrowser)
        thread.start()

    if parsed_args.backend != "no":
        print(
            "Kangas backend is now running on %s://%s:%s/..."
            % (KANGAS_BACKEND_PROTOCOL, KANGAS_BACKEND_HOST, KANGAS_BACKEND_PORT)
        )
        if debug_level == "DEBUG":
            # No try
            if parsed_args.backend == "tornado":
                kangas.server.start_tornado_server(
                    port=KANGAS_BACKEND_PORT,
                    debug_level=debug_level,
                    max_workers=parsed_args.max_workers,
                )
            elif parsed_args.backend == "flask":
                kangas.server.start_flask_server(
                    host=KANGAS_BACKEND_HOST,
                    port=KANGAS_BACKEND_PORT,
                    debug_level=debug_level,
                    max_workers=parsed_args.max_workers,
                )
            else:
                raise Exception("unknown backend: %s" % parsed_args.backend)
        else:
            try:
                if parsed_args.backend == "tornado":
                    kangas.server.start_tornado_server(
                        port=KANGAS_BACKEND_PORT,
                        debug_level=debug_level,
                        max_workers=parsed_args.max_workers,
                    )
                elif parsed_args.backend == "flask":
                    kangas.server.start_flask_server(
                        host=KANGAS_BACKEND_HOST,
                        port=KANGAS_BACKEND_PORT,
                        debug_level=debug_level,
                        max_workers=parsed_args.max_workers,
                    )
                else:
                    raise ValueError("unknown backend: %s" % parsed_args.backend)
            except ValueError:
                raise
            except Exception as e:
                print(e)
                print(
                    "Unable to start backend; perhaps already running? Running frontend anyway..."
                )
                if parsed_args.frontend != "no":
                    node_process.wait()
                return

        print("Stopping backend...")
        if parsed_args.frontend != "no":
            print("Stopping frontend...")
            node_process.terminate()
    elif parsed_args.frontend != "no":
        node_process.wait()


def main(args):
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    get_parser_arguments(parser)
    parsed_args = parser.parse_args(args)

    server(parsed_args)


if __name__ == "__main__":
    # Called via `python -m kangas.cli.server ...`
    # Called via `kangas server ...`
    main(sys.argv[1:])
