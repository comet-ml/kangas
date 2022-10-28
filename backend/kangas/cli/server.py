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

import argparse
import os
import subprocess
import sys
import time
import urllib
import webbrowser

import kangas.server
from kangas.datatypes.utils import download_filename

from kangas import _in_colab_environment, get_localhost, terminate

try:
    from datasets import load_dataset as huggingface_load_dataset
except Exception:
    huggingface_load_dataset = None


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
        default="tornado",
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
        "-o",
        "--open",
        help="How to open page in a webbrowser; 'tab', 'window', or 'no'",
        type=str,
        default="tab",
    )
    parser.add_argument(
        "--host",
        help="The name or IP the servers will listen on",
        type=str,
        default=None,
    )
    parser.add_argument(
        "--debug",
        help="Use this flag to display output from servers",
        default=False,
        action="store_true",
    )
    parser.add_argument(
        "--terminate",
        help="Kill the Kangas servers",
        default=False,
        action="store_true",
    )
    parser.add_argument(
        "--protocol",
        "-p",
        help="Use this flag to set a protocol for server requests. Defaults to http",
        type=str,
        default="http",
    )
    parser.add_argument(
        "--colab",
        help="Use this flag to specify if Kangas is in a Colab environment. Defaults to false",
        default=False,
    )
    parser.add_argument(
        "--type",
        help="If you are viewing a non-datagrid filename that doesn't have appropriate extension, set the type",
        type=str,
        default=None,
    )
    parser.add_argument(
        "--split",
        help="If you are viewing a HuggingFace dataset, set the split name",
        type=str,
        default=None,
    )


def server(parsed_args, remaining=None):
    # Called via `kangas server ...`
    try:
        import nodejs
    except Exception:
        nodejs = None

    KANGAS_FRONTEND_PORT = parsed_args.frontend_port
    KANGAS_HOST = parsed_args.host if parsed_args.host is not None else get_localhost()
    KANGAS_PROTOCOL = parsed_args.protocol
    IN_COLAB = (
        parsed_args.colab if parsed_args.colab is not False else _in_colab_environment()
    )
    if parsed_args.backend_port is None:
        KANGAS_BACKEND_PORT = parsed_args.frontend_port + 1
    else:
        KANGAS_BACKEND_PORT = parsed_args.backend_port

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
            "Kangas frontend is now running on %s://%s:%s/..."
            % (KANGAS_PROTOCOL, KANGAS_HOST, KANGAS_FRONTEND_PORT)
        )
        # node uses PORT to listen on; this is a local process
        # so shouldn't effect any other node servers

        env = os.environ.copy()
        env.update(
            {
                "NODE_ENV": "production",
                "PORT": str(KANGAS_FRONTEND_PORT),
                "KANGAS_BACKEND_PORT": str(KANGAS_BACKEND_PORT),
                "KANGAS_HOST": str(KANGAS_HOST),
                "KANGAS_PROTOCOL": KANGAS_PROTOCOL,
                "IN_COLAB": str(IN_COLAB),
            }
        )
        # first, check to see if nodejs is good:
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
                if not parsed_args.debug:
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

                if not parsed_args.debug:
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

            if not parsed_args.debug:
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
        host = "%s://%s:%s/" % (KANGAS_PROTOCOL, KANGAS_HOST, KANGAS_FRONTEND_PORT)
        query_vars = {}
        if parsed_args.DATAGRID is not None:
            filename = download_filename(parsed_args.DATAGRID)
            if parsed_args.type is not None:
                file_type = parsed_args.type
            elif "." in filename:
                basefile, file_type = filename.rsplit(".", 1)
            else:
                file_type = "huggingface"

            if file_type == "datagrid":
                # Nothing to do; already a datagrid
                pass
            elif file_type == "csv":
                dg = kangas.read_csv(filename)
                dg.save()
                filename = dg.filename
            elif file_type == "huggingface":
                if huggingface_load_dataset is None:
                    raise Exception(
                        "unable to load a huggingface dataset, or invalid filename: %r"
                        % filename
                    )

                if parsed_args.split is not None:
                    dataset = huggingface_load_dataset(
                        filename, split=parsed_args.split
                    )
                else:
                    dataset_splits = huggingface_load_dataset(filename)
                    split = list(dataset_splits.keys())[0]
                    dataset = huggingface_load_dataset(filename, split=split)

                dg = kangas.DataGrid(dataset)
                dg.save()
                filename = dg.filename
            else:
                raise Exception("Unknown file type: %r" % file_type)

            query_vars["datagrid"] = filename
        if query_vars:
            url = "%s?%s" % (host, urllib.parse.urlencode(query_vars))
        else:
            url = host
        time.sleep(1)
        webbrowser.open(url, new=new, autoraise=True)

    if parsed_args.backend != "no":
        print(
            "Kangas backend is now running on %s://%s:%s/..."
            % (KANGAS_PROTOCOL, KANGAS_HOST, KANGAS_BACKEND_PORT)
        )
        try:
            kangas.server.start_tornado_server(
                port=KANGAS_BACKEND_PORT, debug=parsed_args.debug
            )
        except Exception:
            print("Unable to start backend; perhaps already running")
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
