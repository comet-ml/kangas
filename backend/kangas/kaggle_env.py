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


def init_kaggle(port):
    # Check to see if the token is in ~/.ngrok2/ngrok.yml
    # authtoken: ...
    ngrok_yml = os.path.expanduser("~/.ngrok2/ngrok.yml")
    auth_token = None
    if os.path.isfile(ngrok_yml):
        with open(ngrok_yml) as fp:
            line = fp.readline()
            while line:
                key, value = [item.strip() for item in line.split(":")]
                if key == "authtoken":
                    auth_token = value
                    break
                line = fp.readline()

    if auth_token is None:
        while True:
            print(
                "Copy your Kaggle Authorization Token from here: https://dashboard.ngrok.com/get-started/setup"
            )
            print("Paste it below: ")
            auth_token = getpass.getpass("Kaggle Authorization Token: ")
            if " " in auth_token:
                auth_token = auth_token.split(" ")[-1]
            if 45 < len(auth_token) < 55:
                break
            if auth_token == "":
                raise Exception("No kaggle auth token given")

    print("Starting ngrok...")
    ngrok.set_auth_token(auth_token)
    tunnel = ngrok.connect(port, "http")
    return tunnel
