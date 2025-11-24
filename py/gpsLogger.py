import urllib3
import json
import gps
from time import strftime, strptime, time, mktime, sleep
import calendar

def readPosition(record):
        data = None
        time = getattr(record, 'time', None)
        if not time is None:
                reportTime = strptime(time, '%Y-%m-%dT%H:%M:%S.%fZ')
                reportTimestamp = calendar.timegm(reportTime)
                latitude = getattr(record, 'lat', None)
                longitude = getattr(record, 'lon', None)
                altitude = getattr(record, 'alt', None)
                latError = getattr(record, 'epy', None)
                lonError = getattr(record, 'epx', None)
                altError = getattr(record, 'epv', None)
                data = {
                        'utc': int(reportTimestamp * 1000),
                        'boatTime' : None,
                        'latitude': latitude,
                        'longitude': longitude,
                        'altitude': altitude,
                        'latError':latError,
                        'lonError':lonError,
                        'altError': altError
                }
        return data

def sendPosition(data, poolManager):
        encoded_data = json.dumps(data).encode('utf-8')
        r = poolManager.request(
                'PUT',
                apiUrl,
                body=encoded_data,
                headers={'Content-Type': 'application/json'}
        )
        #print(r.data.decode('utf-8'))

def main():
        poolManager = urllib3.PoolManager()
        session = gps.gps(mode=gps.WATCH_ENABLE | gps.WATCH_NEWSTYLE)
		for report in session:
                try:
                        if report['class'] == 'TPV':
                                data = readPosition(report)
                                if not data is None:
                                        sendPosition(data, poolManager)
                except KeyError as argument:
                        print('There was a KeyError Exception: ', argument)
                except KeyboardInterrupt as argument:
                        print('There was a KeyboardInterrupt Exception: ', argument)
                        quit()
                except StopIteration as argument:
                        print('There was a StopIteration Exception: ', argument)
                sleep(0.05)


apiUrl = 'http://localhost/pilotapi/v1/Position/local'
main()