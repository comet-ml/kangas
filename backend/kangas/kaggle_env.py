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

import getpass
import os

from pyngrok import ngrok

from .utils import _is_running, _process_method


def init_kaggle(port):
    # Check to see if the token is in ~/.ngrok2/ngrok.yml
    # authtoken: ...

    for ngrok_config in ["~/.config/ngrok/ngrok.yml", "~/.ngrok2/ngrok.yml"]:
        ngrok_yml = os.path.expanduser(ngrok_config)
        auth_token = None
        if os.path.isfile(ngrok_yml):
            with open(ngrok_yml) as fp:
                line = fp.readline()
                while line:
                    key, value = [item.strip() for item in line.split(":")]
                    if key == "authtoken":
                        auth_token = value
                        print("Kaggle auth token found in %r" % ngrok_yml)
                        break
                    line = fp.readline()
        if auth_token:
            break

    if auth_token is None:
        while True:
            print(
                "Copy your Ngrok Authorization Token from here: https://dashboard.ngrok.com/get-started/setup"
            )
            print("Paste it below: ")
            try:
                auth_token = getpass.getpass("Ngrok Authorization Token: ")
            except Exception:
                raise Exception("This notebook should be run interactively") from None
            if " " in auth_token:
                auth_token = auth_token.split(" ")[-1]
            if 45 < len(auth_token) < 55:
                break
            if auth_token == "":
                raise Exception("No kaggle auth token given")

    if _is_running("ngrok", "start"):
        _process_method("ngrok", "start", "terminate")

    print("Starting ngrok...")
    ngrok.set_auth_token(auth_token)
    tunnel = ngrok.connect(port, "http")
    return tunnel
