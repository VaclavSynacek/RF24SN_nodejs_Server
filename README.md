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
sudo rf24sn -b mqtt://localhost:1883 -spi /dev/spidev0.0 -ce 25 -irq 24
```
or if the above defaults are ok any or all can be omited:
```Shell
sudo rf24sn
```
The sudo is required in standard Raspbian instalation unless access to /dev/spidevX.X and the GPIO pins has been granted to other user (via [quick2wire](https://github.com/quick2wire/quick2wire-gpio-admin) or similar).
