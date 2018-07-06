#!/bin/bash
script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
project_dir="${script_dir}/.."

board_arch="esp32"
board_port="/dev/tty.SLAB_USBtoUART"
iot_policy_name="meetup-quiz-devices-QuizDevicePolicy-B4SO2NMYCRMQ"
iot_thing_name="quizdemo1"

echo "INFO: Building software"
mos build --arch $board_arch

echo "INFO: Flashing software"
mos flash --port $board_port

echo "INFO: Provisioning iot credentials"
mos aws-iot-setup \
  --aws-iot-policy $iot_policy_name \
  --aws-iot-thing $iot_thing_name \
  --port $board_port

echo "INFO: Device provisioned."
