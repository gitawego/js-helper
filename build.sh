#!/bin/bash
SCRIPT_PATH=$(cd "$(dirname "$0")"; pwd);
cd ${SCRIPT_PATH}

echo ${SCRIPT_PATH}



babel src --out-dir dist --modules umd -r