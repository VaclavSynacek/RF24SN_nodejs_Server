RF24SN nodejs Server
====================

Full implementation of [RF24SN](https://github.com/VaclavSynacek/RF24SN) with little dependencies. Should run on all
platforms where there is nodejs and the [node-nrf](https://github.com/natevw/node-nrf) driver / [pi-spi](https://github.com/natevw/pi-spi) driver - currently it has been tested on Raspberry Pi.

For full description of protocol, client server setup or alternative implementations, see [RF24SN](https://github.com/VaclavSynacek/RF24SN)


Installation:
```Shell
npm install rf24sn --global
```
Uninstallation:
```Shell
npm uninstall rf24sn --global
```
Usage:
```Shell
sudo rf24sn -b mqtt://localhost:1883 -spi /dev/spidev0.0 -ce 25 -irq 24 -vvv
```
or if the above defaults are ok any or all can be omited:
```Shell
sudo rf24sn
```

The -v parameter sets logging level:
* (no v) : almost silent, only errors and warnings
* -v : only received radio packets are reported
* -vv : received radio packets and MQTT communication is reported
* -vvv : debug info
* -vvvv : silly amount of data including underlaying nrf pipes statuses

The sudo is required in standard Raspbian instalation unless access to /dev/spidevX.X and the GPIO pins has been granted to other user (via [quick2wire](https://github.com/quick2wire/quick2wire-gpio-admin) or similar).


## Wiring

![Wiring](https://raw.githubusercontent.com/VaclavSynacek/RF24SN_nodejs_Server/master/nRF24L01-RPi.png "Wiring")

The SPI wires (yellow) have to go exactly to their counterparts:
* MOSI to MOSI
* MISO to MISO
* SCK to SC(L)K

The VCC (red) has to go to any **3.3V** pin. Connecting it to 5V pin will damage the nRF24L01.

GRN (black) can go to any ground.

The CSN (blue) has to go to either CS0 or CS1. This determines the spi device. To use the /dev/spidev0.**0** use the CS **0**.

The CE and IRQ (cyan) can go to any GPIO pin. The diagram follows the rf24sn defaults - CE 25, IRQ 24.
