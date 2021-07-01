#!/bin/bash
HOME_DIR=$(pwd)

cd $1

cp circuit.wasm circuit_final.zkey verification_key.json $HOME_DIR/../heimdalljs/zkp/$2 