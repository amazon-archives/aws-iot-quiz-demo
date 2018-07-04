# AWS IoT - Quiz Demo

The purpose of this demo is to showcase the capabilities of IoT by developing a quiz game using Microcontrollers, connected to the cloud. Each player has a "buzzer" device, in which they can select the answer to a given question, by tapping one or other button. The cloud orchestrates all the game and the responses from the participants.

## Quiz Device

The Quiz devices are AWS Hexa-boards, with very similar compute functionalities to the ESP32 DevKitC. On top of the MCU we have a couple buttons - that we will use to submit the responses and for other interactions - and 6 RGB leds at the vertexes of the hexagon.

![AWS Hexa board](/static/board-img.png)

We will use [Mongoose OS](https://mongoose-os.com/) to program our microcontroller to do what we want it to do. You can find the code we will use for the devices on the `device/` folder.

These devices are connected to WiFi and the AWS IoT broker, to receive and transmit data updates in real time. This channel is used from the Cloud to send any status update, and from the device to report the responses to the questions - amongst other things.

![Quiz Architectural diagram](/static/arch-quiz.png)