from gps3 import gps3
import urllib3
import json
from time import strftime, strptime, time, mktime, sleep

def readPosition(record):
	data = None
	if record['time'] != 'n/a':
		reportTime = strptime(record['time'], '%Y-%m-%dT%H:%M:%S.%fZ')
		reportTimestamp = mktime(reportTime)
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
			'utc': reportTimestamp * 1000,
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
		headers={'Content-Type': 'application/json'})
	
	# TODO: Add Authentication! This will only work as long as
	# anonymous user has write permission, needed for putting to /Position

def main():
	poolManager = urllib3.PoolManager()
	gps_socket = gps3.GPSDSocket()
	data_stream = gps3.DataStream()
	gps_socket.connect()
	gps_socket.watch()
	for new_data in gps_socket:
		try:
			if new_data:
				data_stream.unpack(new_data)
				if data_stream.TPV['time'] != 'n/a':
					data = readPosition(data_stream.TPV)
					if not data is None:
						sendPosition(data, poolManager)
		except KeyError:
			pass
		except KeyboardInterrupt:
			quit()
		except StopIteration as argument:
			print('There was a StopIteration Exception: ', argument)
			pass
		sleep(0.05)


apiUrl = 'http://localhost/pilotapi/v1/Position'
main()