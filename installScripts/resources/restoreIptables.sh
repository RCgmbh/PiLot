#!/bin/sh
iptables-restore < /etc/iptables.ipv4.nat
exit 0