import urllib3
import json
import gps
from time import strftime, strptime, time, mktime, sleep
import calendar

def readPosition(record):
        data = None
        if record['time'] != 'n/a':
                reportTime = strptime(record['time'], '%Y-%m-%dT%H:%M:%S.%fZ')
                reportTimestamp = calendar.timegm(reportTime)
                if record['lat'] != 'n/a':
                        latitude = record['lat']
                else:
                        latitude = None
                if record['lon'] != 'n/a':
                        longitude = record['lon']
                else:
                        longitude = None
                if record['alt'] != 'n/a':
                        altitude = record['alt']
                else:
                        altitude = None
                if record['epy'] != 'n/a':
                        latError = record['epy']
                else:
                        latError = None
                if record['epx'] != 'n/a':
                        lonError = record['epx']
                else:
                        lonError = None
                if record['epv'] != 'n/a':
                        altError = record['epv']
                else:
                        altError = None
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
        try:
                for report in session:
                        if report['class'] == 'TPV':
                                data = readPosition(report)
                                if not data is None:
                                        sendPosition(data, poolManager)
                        sleep(0.05)
        except KeyError:
                pass
        except KeyboardInterrupt:
                quit()
        except StopIteration as argument:
                print('There was a StopIteration Exception: ', argument)
                pass


apiUrl = 'http://localhost/pilotapi/v1/Position/local'
main()